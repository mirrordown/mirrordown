import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { del } from "../../packages/mdit-del/src";
import { ins } from "../../packages/mdit-ins/src";
import { kbd } from "../../packages/mdit-kbd/src";
import { mark } from "../../packages/mdit-mark/src";
import { remarkDel } from "../../packages/remd-del/src";
import { remarkIns } from "../../packages/remd-ins/src";
import { remarkKbd } from "../../packages/remd-kbd/src";
import { remarkMark } from "../../packages/remd-mark/src";
import { satteriDel } from "../../packages/sat-del/src";
import { satteriIns } from "../../packages/sat-ins/src";
import { satteriKbd } from "../../packages/sat-kbd/src";
import { satteriMark } from "../../packages/sat-mark/src";
import { normalizeHtml } from "../utils/index.js";

// The edges of `[[key]]`: what counts as a bracket, what a key may hold, and where a key meets link syntax. markdown-it reads the source while remark and Sätteri read the parsed tree, so each case here is one where the two readings once disagreed. del, ins and mark run beside kbd because an escape has to outlive the plugins that scan before it.

const md = new MarkdownIt().use(del).use(ins).use(kbd).use(mark);
const mdit = (input: string): string => normalizeHtml(md.render(input));

const remarkProcessor = unified()
  .use(remarkParse)
  .use(remarkDel)
  .use(remarkIns)
  .use(remarkKbd)
  .use(remarkMark)
  .use(remarkRehype)
  .use(rehypeStringify);
const remd = (input: string): string =>
  normalizeHtml(String(remarkProcessor.processSync(input)));

const sat = (input: string, smartPunctuation = false): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: { gfm: false, frontmatter: false, smartPunctuation },
      mdastPlugins: [satteriDel(), satteriIns(), satteriKbd(), satteriMark()]
    }).html
  );

const engines = [
  ["markdown-it", mdit],
  ["remark", remd],
  ["sätteri", sat]
] as const;

type Case = [name: string, input: string, expected: string];

const escapes: Case[] = [
  [
    "an escaped key after a del span stays literal",
    String.raw`--a-- \[[x]]`,
    "<p><del>a</del> [[x]]</p>"
  ],
  [
    "an escaped key after an ins span stays literal",
    String.raw`++a++ \[[x]]`,
    "<p><ins>a</ins> [[x]]</p>"
  ],
  [
    "an escaped mark after a key stays literal",
    String.raw`[[k]] \==a==`,
    "<p><kbd>k</kbd> ==a==</p>"
  ],
  [
    "an escaped key after a reference that decodes to two characters stays literal",
    String.raw`&fjlig;\[[x]]`,
    "<p>fj[[x]]</p>"
  ],
  [
    "an escaped character before a key does not stop the key",
    String.raw`\![[a]]`,
    "<p>!<kbd>a</kbd></p>"
  ],
  [
    "a private-use character the author typed is kept beside a key",
    "[[a]] \u{F0021} b",
    "<p><kbd>a</kbd> \u{F0021} b</p>"
  ],
  [
    "private-use characters never turn into brackets",
    "\u{F005B}\u{F005B}x\u{F005D}\u{F005D} [[k]]",
    "<p>\u{F005B}\u{F005B}x\u{F005D}\u{F005D} <kbd>k</kbd></p>"
  ],
  ["a referenced first opener is not a bracket", "&#91;[x]]", "<p>[[x]]</p>"],
  ["a referenced second opener is not a bracket", "[&#91;x]]", "<p>[[x]]</p>"],
  ["a referenced first closer is not a bracket", "[[x&#93;]", "<p>[[x]]</p>"],
  ["a referenced second closer is not a bracket", "[[x]&#93;", "<p>[[x]]</p>"],
  [
    "named bracket references are not brackets",
    "&lsqb;&lsqb;x&rsqb;&rsqb;",
    "<p>[[x]]</p>"
  ],
  [
    "a referenced line feed is a character of the key, not a line ending",
    "[[a&#10;b]]",
    "<p><kbd>a\nb</kbd></p>"
  ]
];

// `[[…]]` is the key syntax, so where the brackets could also be read as a link, the key wins, as markdown-it-kbd has always had it (its rule runs ahead of the link rule). A link that starts after the opener is one unit of the key's content.
const links: Case[] = [
  [
    "a key whose name is a defined reference label is still a key",
    "[[Enter]]\n\n[Enter]: /u",
    "<p><kbd>Enter</kbd></p>"
  ],
  [
    "a key followed by parentheses is a key, not a link",
    "[[a]](url)",
    "<p><kbd>a</kbd>(url)</p>"
  ],
  [
    "a key followed by a reference keeps the reference as a link",
    "[[a]][ref]\n\n[ref]: /u",
    '<p><kbd>a</kbd><a href="/u">ref</a></p>'
  ],
  [
    "a key followed by empty brackets is a key",
    "[[a]][]\n\n[a]: /u",
    "<p><kbd>a</kbd>[]</p>"
  ],
  [
    "a key after an exclamation mark is a key",
    "![[a]]\n\n[a]: /u",
    "<p>!<kbd>a</kbd></p>"
  ],
  [
    "a link that starts on the opener's second bracket is the key's text",
    "[[a](url)]]",
    "<p><kbd>a](url)</kbd></p>"
  ],
  [
    "a third bracket nests the same way beside link syntax",
    "[[[a]](url)]]",
    "<p><kbd>[a]](url)</kbd></p>"
  ],
  [
    "a closer inside that link's destination closes the key",
    "[[a](b]]c) d]]",
    "<p><kbd>a](b</kbd>c) d]]</p>"
  ],
  [
    "escaped brackets in the destination after a key stay literal",
    String.raw`[[a]](u\]\]rl)`,
    "<p><kbd>a</kbd>(u]]rl)</p>"
  ],
  [
    "a link whose text opens with a key that closes inside it stays a link",
    "[[[k]] x](url)",
    '<p><a href="url"><kbd>k</kbd> x</a></p>'
  ],
  [
    "a link beside a key is untouched",
    "[[k]] and [docs](url)",
    '<p><kbd>k</kbd> and <a href="url">docs</a></p>'
  ],
  [
    "a link inside a key is one unit of its content",
    "[[x [a]]]\n\n[a]: /u",
    '<p><kbd>x <a href="/u">a</a></kbd></p>'
  ]
];

// A key holds inline content, and a construct inside it is opaque: brackets in a code span or an autolink are that construct's characters. Only a line ending at the key's own level ends the attempt.
const content: Case[] = [
  [
    "a closer inside a code span does not close the key",
    "[[a `]]` b]]",
    "<p><kbd>a <code>]]</code> b</kbd></p>"
  ],
  [
    "a closer inside an autolink does not close the key",
    "[[<http://a.b/]]>]]",
    '<p><kbd><a href="http://a.b/%5D%5D">http://a.b/]]</a></kbd></p>'
  ],
  [
    "a line ending inside a code span does not end the key",
    "[[a `x\ny` b]]",
    "<p><kbd>a <code>x y</code> b</kbd></p>"
  ],
  [
    "a code span after a key is still a code span when a stray backtick follows",
    "[[k]] `a` b` c",
    "<p><kbd>k</kbd> <code>a</code> b` c</p>"
  ],
  [
    "a backslash line break ends the attempt",
    "[[a\\\nb]]",
    "<p>[[a<br>\nb]]</p>"
  ],
  [
    "a trailing-space line break ends the attempt",
    "[[a  \nb]]",
    "<p>[[a<br>\nb]]</p>"
  ]
];

describe.each(engines)("kbd edges (%s)", (_engine, render) => {
  it.each(escapes)("escapes: %s", (_name, input, expected) => {
    expect(render(input)).toBe(expected);
  });

  it.each(links)("links: %s", (_name, input, expected) => {
    expect(render(input)).toBe(expected);
  });

  it.each(content)("content: %s", (_name, input, expected) => {
    expect(render(input)).toBe(expected);
  });

  it("a lone carriage return is a line ending, so no key forms across it", () => {
    // The engines write the line ending back differently, so only the key is asserted.
    expect(render("[[a\rb]]")).not.toContain("<kbd>");
  });

  it("stops nesting at 100 keys, markdown-it's nesting limit, instead of overflowing", () => {
    const nested = (depth: number): string =>
      "[[".repeat(depth) + "x" + "]]".repeat(depth);
    const keys = (html: string): number => html.split("<kbd>").length - 1;
    expect(keys(render(nested(100)))).toBe(100);
    expect(keys(render(nested(150)))).toBe(100);
    expect(keys(render(nested(3000)))).toBe(100);
  });

  // Untrusted input must not make the scan quadratic: before the fix each of these took well over ten seconds (the time grew with the square of the length). They now run in under half a second, and the bound leaves a slow runner ten times that.
  it.each([
    ["only openers", "[[".repeat(40000)],
    ["openers between words", "a [[ ".repeat(30000)],
    ["many openers and one closer", "[[".repeat(40000) + "]]"]
  ])("scans a line of %s in linear time", (_name, input) => {
    const started = performance.now();
    render(input);
    expect(performance.now() - started).toBeLessThan(5000);
  });
});

describe("kbd edges: smart punctuation in Sätteri", () => {
  // Smart punctuation rewrites characters, so the text no longer lines up with the source one to one. An escape after a rewritten character must still be found.
  it.each([
    [String.raw`"q" \[[x]] [[y]]`, "<p>“q” [[x]] <kbd>y</kbd></p>"],
    [String.raw`a -- b \[[x]] [[y]]`, "<p>a – b [[x]] <kbd>y</kbd></p>"],
    [String.raw`it's \[[x]]`, "<p>it’s [[x]]</p>"]
  ])("an escaped key stays literal in %s", (input, expected) => {
    expect(sat(input, true)).toBe(expected);
  });
});

describe("kbd edges: image alt text, a known difference between the engines", () => {
  // markdown-it runs inline rules inside an image label and renders the alt from the result, so the brackets are gone. In mdast the alt is a string the parser wrote, which no plugin scans. Pinned so that closing the gap, or widening it, is a deliberate change (the guide documents it).
  const input = "![[[a]]](pic.png)";

  it("markdown-it drops the brackets", () => {
    expect(mdit(input)).toBe('<p><img src="pic.png" alt="a"></p>');
  });

  it.each([
    ["remark", remd],
    ["sätteri", sat]
  ] as const)("%s keeps the alt as written", (_engine, render) => {
    expect(render(input)).toBe('<p><img src="pic.png" alt="[[a]]"></p>');
  });
});
