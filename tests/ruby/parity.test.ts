import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { ruby } from "../../packages/mdit-ruby/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { mark } from "../../packages/mdit-mark/src";
import { remarkRuby } from "../../packages/remd-ruby/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { remarkMark } from "../../packages/remd-mark/src";
import { satteriRuby } from "../../packages/sat-ruby/src";
import { satteriMark } from "../../packages/sat-mark/src";
import { normalizeHtml } from "../utils/index.js";

// The three engines scan for a ruby separately, so each case here runs in all of them against one expected string: where they drift, an author's document renders differently depending on the engine.
const mdAlone = new MarkdownIt().use(ruby);
const mdStack = new MarkdownIt().use(ruby).use(attrs).use(mark);

const engines = {
  "markdown-it": (src: string, stack: boolean): string =>
    (stack ? mdStack : mdAlone).render(src),
  remark: (src: string, stack: boolean): string => {
    const processor = unified().use(remarkParse).use(remarkGfm).use(remarkRuby);
    if (stack) processor.use(remarkAttrs).use(remarkMark);
    return String(
      processor.use(remarkRehype).use(rehypeStringify).processSync(src)
    );
  },
  sätteri: (src: string, stack: boolean): string =>
    markdownToHtml(src, {
      features: {
        gfm: true,
        frontmatter: false,
        smartPunctuation: false,
        attributes: stack
      },
      mdastPlugins: stack ? [satteriRuby(), satteriMark()] : [satteriRuby()]
    }).html
};

const everyEngine = (
  cases: readonly (readonly [string, string, string])[],
  stack = false
): void => {
  describe.each(cases)("%s", (_name, input, expected) => {
    it.each(Object.entries(engines))("%s", (_engine, render) => {
      expect(normalizeHtml(render(input, stack))).toBe(expected);
    });
  });
};

const R = (base: string, reading: string): string =>
  `<ruby>${base}<rt>${reading}</rt></ruby>`;

describe("ruby: a ruby stays on one line and inside one brace group", () => {
  everyEngine([
    [
      "prose braces and a pipe on separate lines are not a ruby",
      "Use {name} as a placeholder.\nThen a | b or {x}.",
      "<p>Use {name} as a placeholder.\nThen a | b or {x}.</p>"
    ],
    ["a line ending in the base", "{a\nb|c}", "<p>{a\nb|c}</p>"],
    ["a line ending in the reading", "{a|b\nc}", "<p>{a|b\nc}</p>"],
    [
      "a closed brace group before a ruby is left alone",
      "{a}{b|c}",
      `<p>{a}${R("b", "c")}</p>`
    ],
    [
      "an open brace inside the base restarts the ruby there",
      "{a{b|c}",
      `<p>{a${R("b", "c")}</p>`
    ],
    [
      "a close brace before the pipe ends the attempt",
      "{a} text | b}",
      "<p>{a} text | b}</p>"
    ],
    ["an escaped close brace before the pipe", "{a\\}|b}", "<p>{a}|b}</p>"],
    [
      "a ruby holding a `]` is one unit inside a link label",
      "[{a|b]c}](/url)",
      `<p><a href="/url">${R("a", "b]c")}</a></p>`
    ]
  ]);
});

describe("ruby: whitespace beside a ruby is content", () => {
  everyEngine([
    ["after emphasis", "*x* {a|b}", `<p><em>x</em> ${R("a", "b")}</p>`],
    ["before emphasis", "{a|b} *x*", `<p>${R("a", "b")} <em>x</em></p>`],
    [
      "between code spans",
      "`c` {a|b} `d`",
      `<p><code>c</code> ${R("a", "b")} <code>d</code></p>`
    ],
    [
      "between links",
      "[l](u) {a|b} [m](v)",
      `<p><a href="u">l</a> ${R("a", "b")} <a href="v">m</a></p>`
    ],
    [
      "on a list item's continuation line",
      "- 日本 {a|b}\n  続き *x* {c|d}",
      `<ul><li>日本 ${R("a", "b")}\n続き <em>x</em> ${R("c", "d")}</li></ul>`
    ]
  ]);

  // Not normalised: `normalizeHtml` drops a line break between two tags, which is the content under test.
  it.each(Object.entries(engines))(
    "a line break between emphasis and a ruby (%s)",
    (_, render) => {
      expect(render("*x*\n{a|b}\n*y*", false)).toContain(
        `<em>x</em>\n${R("a", "b")}\n<em>y</em>`
      );
    }
  );
});

describe("ruby: braces are punctuation to the emphasis beside them", () => {
  everyEngine([
    [
      "strong inside CJK text",
      "これは**{漢字|かんじ}**です",
      `<p>これは**${R("漢字", "かんじ")}**です</p>`
    ],
    ["emphasis after a letter", "a*{b|c}*", `<p>a*${R("b", "c")}*</p>`],
    ["strong before a letter", "**{b|c}**a", `<p>**${R("b", "c")}**a</p>`],
    [
      "emphasis at the edges of a line still wraps the ruby",
      "*{b|c}*",
      `<p><em>${R("b", "c")}</em></p>`
    ]
  ]);
});

describe("ruby: spaces and tabs around a base or a reading are not part of it", () => {
  everyEngine([
    ["both sides of both parts", "{ a | b }", `<p>${R("a", "b")}</p>`],
    ["mid-word, after the reading", "x{a|b }y", `<p>x${R("a", "b")}y</p>`],
    ["tabs", "{a\t|\tb}", `<p>${R("a", "b")}</p>`],
    [
      "four leading spaces are not an indented code block",
      "{    a|b}",
      `<p>${R("a", "b")}</p>`
    ],
    ["a base of only whitespace is kept", "{ |b}", `<p>${R(" ", "b")}</p>`],
    ["a reading of only whitespace is kept", "{a| }", `<p>${R("a", " ")}</p>`],
    [
      "the first pipe splits, whatever follows it",
      "{note: ||secret||}",
      `<p>${R("note:", "|secret||")}</p>`
    ]
  ]);
});

describe("ruby: a backslash before the pipe is the table's only inside a table", () => {
  everyEngine([
    [
      "outside a table it stays in the base",
      "{a\\|b}",
      `<p>${R("a\\", "b")}</p>`
    ],
    [
      "outside a table, with a second pipe",
      "{a\\|b|c}",
      `<p>${R("a\\", "b|c")}</p>`
    ]
  ]);

  it.each(Object.entries(engines))(
    "inside a table cell it escapes the pipe (%s)",
    (_, render) => {
      expect(render("| {a\\|b\\|c} | x |\n| - | - |", false)).toContain(
        R("a", "b|c")
      );
    }
  );
});

describe("ruby: text the author wrote is never taken for a ruby's stand-in", () => {
  everyEngine([
    [
      "private-use characters around a digit",
      "0 and ⸨5⸩ {a|b}",
      `<p>0 and ⸨5⸩ ${R("a", "b")}</p>`
    ]
  ]);
});

// Sätteri re-parses the lines around a ruby on their own. A later line of a paragraph can start with anything once it is indented four columns: read alone and unindented, the same characters open a quote, a list, a heading or a fence, which dropped the `>` or cut the paragraph off at the line before.
describe("ruby: a continuation line that starts like a block is still the paragraph's text", () => {
  everyEngine([
    [
      "a `>` on an indented line is text, not a quote marker",
      "a\n    > b {x|y}",
      `<p>a\n> b ${R("x", "y")}</p>`
    ],
    [
      "the same in a list item",
      "- a\n      > b {x|y}",
      `<ul><li>a\n> b ${R("x", "y")}</li></ul>`
    ],
    [
      "in a block quote the quote's own marker comes off and the next `>` stays",
      "> a\n>     > b {x|y}",
      `<blockquote><p>a\n> b ${R("x", "y")}</p></blockquote>`
    ],
    [
      "a quote's markers come off every line, and a lazy line has none",
      "> a {x|y}\nb {x|y}\n> c {x|y}",
      `<blockquote><p>a ${R("x", "y")}\nb ${R("x", "y")}\nc ${R("x", "y")}</p></blockquote>`
    ],
    [
      "a list marker on an indented line keeps the lines after it",
      "a\n    - b {x|y}",
      `<p>a\n- b ${R("x", "y")}</p>`
    ],
    [
      "an ordered list marker likewise",
      "a\n    1. b {x|y}",
      `<p>a\n1. b ${R("x", "y")}</p>`
    ],
    [
      "a heading marker likewise",
      "a\n    # b {x|y}",
      `<p>a\n# b ${R("x", "y")}</p>`
    ],
    ["a fence likewise", "a\n    ``` {x|y}", `<p>a\n\`\`\` ${R("x", "y")}</p>`]
  ]);
});

// markdown-it parses a base and a reading as part of the document, so a reference in one finds its definition. remark and Sätteri parse each on its own, where the definition is out of sight unless the plugin shows it the document's labels.
describe("ruby: a reference in a base or a reading finds the document's definition", () => {
  everyEngine([
    [
      "a shortcut reference as the base",
      "{[foo]|bar}\n\n[foo]: /url",
      `<p>${R(`<a href="/url">foo</a>`, "bar")}</p>`
    ],
    [
      "a shortcut reference as the reading",
      "{a|[foo]}\n\n[foo]: /url",
      `<p>${R("a", `<a href="/url">foo</a>`)}</p>`
    ],
    [
      "full and collapsed references, with the definition's title",
      `{[text][foo]|[foo][]}\n\n[foo]: /url "T"`,
      `<p>${R(`<a href="/url" title="T">text</a>`, `<a href="/url" title="T">foo</a>`)}</p>`
    ],
    [
      "an image reference",
      "{![alt][pic]|bar}\n\n[pic]: /p.png",
      `<p>${R(`<img src="/p.png" alt="alt">`, "bar")}</p>`
    ],
    [
      "a definition written before the ruby",
      "[foo]: /url\n\n{[foo]|bar}",
      `<p>${R(`<a href="/url">foo</a>`, "bar")}</p>`
    ],
    [
      "brackets no definition names stay text",
      "{[nope]|bar}\n\n[foo]: /url",
      `<p>${R("[nope]", "bar")}</p>`
    ]
  ]);

  // markdown-it has no footnotes here, so only the two engines that do are compared.
  it.each([
    ["remark", engines.remark],
    ["sätteri", engines.sätteri]
  ] as const)("%s: a footnote reference in a reading", (_engine, render) => {
    expect(normalizeHtml(render("{a|b[^1]}\n\n[^1]: note", false))).toContain(
      `<rt>b<sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref aria-describedby="footnote-label">1</a></sup></rt>`
    );
  });
});

describe("ruby beside attributes and mark", () => {
  everyEngine(
    [
      [
        "an attribute block and a later ruby do not join into one ruby",
        "*a*{.x} and {漢字|かんじ} here",
        `<p><em class="x">a</em> and ${R("漢字", "かんじ")} here</p>`
      ],
      [
        "attributes on emphasis that wraps a ruby",
        "*{漢字|かんじ}*{.x}",
        `<p><em class="x">${R("漢字", "かんじ")}</em></p>`
      ],
      [
        "attributes on a link whose label is a ruby",
        "[{a|b}](/u){.x} z",
        `<p><a href="/u" class="x">${R("a", "b")}</a> z</p>`
      ],
      [
        "attributes on strong that holds a ruby",
        "**x {a|b}**{#id} z",
        `<p><strong id="id">x ${R("a", "b")}</strong> z</p>`
      ],
      [
        "an escaped delimiter after a ruby stays literal",
        "{漢字|かんじ} \\==b==",
        `<p>${R("漢字", "かんじ")} ==b==</p>`
      ],
      [
        "escaped delimiters on both sides of a ruby stay literal",
        "\\==b== {漢字|かんじ} \\*c\\*",
        `<p>==b== ${R("漢字", "かんじ")} *c*</p>`
      ],
      [
        "an escaped delimiter inside a base stays literal",
        "{a \\==b==|c} ==d==",
        `<p>${R("a ==b==", "c")} <mark>d</mark></p>`
      ],
      [
        "a ruby mid-paragraph may start like a class",
        "see {.NET|ドットネット} here",
        `<p>see ${R(".NET", "ドットネット")} here</p>`
      ]
    ],
    true
  );

  // Sätteri reads attributes while it parses, before any plugin runs: a brace group that ends a block and opens like an attribute (`.`, `#`, `key=`) is gone by the time sat-ruby sees the tree. This is an engine limit, pinned so a change in Sätteri is noticed; the guide tells authors to put text after such a ruby.
  it("a ruby that ends a block and opens like an attribute is an attribute block in Sätteri only", () => {
    const input = "{.NET|ドットネット}";
    const expected = `<p>${R(".NET", "ドットネット")}</p>`;
    expect(normalizeHtml(engines["markdown-it"](input, true))).toBe(expected);
    expect(normalizeHtml(engines.remark(input, true))).toBe(expected);
    expect(normalizeHtml(engines.sätteri(input, true))).toBe(
      '<p class="NET|ドットネット"></p>'
    );
  });
});

describe("ruby (remark): the transformer may meet a tree twice", () => {
  // A host that runs its plugins again over a cached tree must get the same tree back, not an exception from a node whose raw fields are already consumed.
  it("a second run changes nothing", () => {
    const processor = unified().use(remarkParse).use(remarkRuby);
    const once = processor.runSync(processor.parse("{a|*b*}"));
    const before = JSON.stringify(once);
    expect(JSON.stringify(processor.runSync(once))).toBe(before);
    expect(before).toContain('"emphasis"');
  });
});

describe("ruby (sätteri): the plugin is listed first", () => {
  const render = (input: string, rubyFirst: boolean): string =>
    normalizeHtml(
      markdownToHtml(input, {
        features: { gfm: true, frontmatter: false, smartPunctuation: false },
        mdastPlugins: rubyFirst
          ? [satteriRuby(), satteriMark()]
          : [satteriMark(), satteriRuby()]
      }).html
    );

  // Listed first, sat-ruby re-reads each block from source, so a ruby may hold other syntax. Listed later it only sees the text nodes the earlier plugin left, and a ruby whose parts that plugin already cut apart is out of reach. The guide states the order; this pins what breaking it costs.
  it("a ruby that holds a mark needs ruby first", () => {
    expect(render("{==a==|b}", true)).toBe(
      `<p>${R("<mark>a</mark>", "b")}</p>`
    );
    expect(render("{==a==|b}", false)).toBe("<p>{<mark>a</mark>|b}</p>");
  });

  it("an escaped brace opens no ruby in either order", () => {
    expect(render("==x== \\{a|b}", true)).toBe("<p><mark>x</mark> {a|b}</p>");
    expect(render("==x== \\{a|b}", false)).toBe("<p><mark>x</mark> {a|b}</p>");
  });
});
