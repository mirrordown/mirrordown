import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified, type Plugin } from "unified";
import type { Root } from "mdast";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { del } from "../../packages/mdit-del/src";
import { ins } from "../../packages/mdit-ins/src";
import { kbd } from "../../packages/mdit-kbd/src";
import { mark } from "../../packages/mdit-mark/src";
import { abbr } from "../../packages/mdit-abbr/src";
import { remarkDel } from "../../packages/remd-del/src";
import { remarkIns } from "../../packages/remd-ins/src";
import { remarkKbd } from "../../packages/remd-kbd/src";
import { remarkMark } from "../../packages/remd-mark/src";
import { remarkAbbr } from "../../packages/remd-abbr/src";
import { satteriDel } from "../../packages/sat-del/src";
import { satteriIns } from "../../packages/sat-ins/src";
import { satteriKbd } from "../../packages/sat-kbd/src";
import { satteriMark } from "../../packages/sat-mark/src";
import { satteriAbbr } from "../../packages/sat-abbr/src";
import { normalizeHtml } from "../utils/index.js";

// The span plugins run one after another in remark and Sätteri, each over the tree the previous one left. del runs first in the presets, so what it leaves behind decides whether the later plugins can still tell an escaped delimiter from a real one. markdown-it scans every marker in one pass and is the reference.

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

const sat = (input: string): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: { gfm: false, frontmatter: false, smartPunctuation: false },
      mdastPlugins: [satteriDel(), satteriIns(), satteriKbd(), satteriMark()]
    }).html
  );

const engines = [
  ["markdown-it", mdit],
  ["remark", remd],
  ["sätteri", sat]
] as const;

describe("del + other span plugins: an escape outlives the del scan", () => {
  const cases: [name: string, input: string, expected: string][] = [
    [
      "an escaped mark after a del span stays literal",
      String.raw`--a-- \==b==`,
      "<p><del>a</del> ==b==</p>"
    ],
    [
      "an escaped ins after a del span stays literal",
      String.raw`--x-- \++b++`,
      "<p><del>x</del> ++b++</p>"
    ],
    [
      "an escaped ins closer after a del span stays literal",
      String.raw`--x-- ++a\++`,
      "<p><del>x</del> ++a++</p>"
    ],
    [
      "an escaped ins inside a del span stays literal",
      String.raw`--a \++b++ c--`,
      "<p><del>a ++b++ c</del></p>"
    ],
    [
      "an escaped ins at the start of a del span stays literal",
      String.raw`--\++a++--`,
      "<p><del>++a++</del></p>"
    ],
    [
      "an escaped key after a del span stays literal",
      String.raw`--a-- \[[x]]`,
      "<p><del>a</del> [[x]]</p>"
    ],
    [
      "an escape survives two scans before the one it is for",
      String.raw`--a-- and ++b++ \==c==`,
      "<p><del>a</del> and <ins>b</ins> ==c==</p>"
    ],
    [
      "a character reference after a del span is still not a delimiter",
      "--a-- &#43;+b++",
      "<p><del>a</del> ++b++</p>"
    ]
  ];

  describe.each(engines)("%s", (_engine, render) => {
    it.each(cases)("%s", (_name, input, expected) => {
      expect(render(input)).toBe(expected);
    });
  });
});

describe("del registered twice: the second scan honours the first one's escapes", () => {
  const input = String.raw`--a --b-- c-- \--d--`;
  const expected = "<p><del>a <del>b</del> c</del> --d--</p>";

  it("remark", () => {
    // unified ignores a second `.use` of the same function, so the repeat is wrapped.
    const again: Plugin<[], Root> = function () {
      return remarkDel.call(this);
    };
    const processor = unified()
      .use(remarkParse)
      .use(remarkDel)
      .use(again)
      .use(remarkRehype)
      .use(rehypeStringify);
    expect(normalizeHtml(String(processor.processSync(input)))).toBe(expected);
  });

  it("sätteri", () => {
    expect(
      normalizeHtml(
        markdownToHtml(input, {
          features: { gfm: false, frontmatter: false, smartPunctuation: false },
          mdastPlugins: [satteriDel(), satteriDel()]
        }).html
      )
    ).toBe(expected);
  });
});

describe("del beside an abbreviation: the abbreviation is plain text for flanking", () => {
  // markdown-it applies abbreviations after inline parsing, so a run beside one sees a letter; remark and Sätteri replace the term with an `abbr` node before del runs.
  const definition = "*[HTML]: Hyper Text\n\n";
  const cases: [name: string, input: string, expected: string][] = [
    [
      "a run between a closing parenthesis and a term does not close",
      "--(a)--HTML",
      '<p>--(a)--<abbr title="Hyper Text">HTML</abbr></p>'
    ],
    [
      "a run between a letter and a term opens",
      "a--HTML--",
      '<p>a<del><abbr title="Hyper Text">HTML</abbr></del></p>'
    ]
  ];

  const abbrMd = new MarkdownIt().use(abbr).use(del);
  const renders = [
    ["markdown-it", (input: string) => normalizeHtml(abbrMd.render(input))],
    [
      "remark",
      (input: string) =>
        normalizeHtml(
          String(
            unified()
              .use(remarkParse)
              .use(remarkAbbr)
              .use(remarkDel)
              .use(remarkRehype)
              .use(rehypeStringify)
              .processSync(input)
          )
        )
    ],
    [
      "sätteri",
      (input: string) =>
        normalizeHtml(
          markdownToHtml(input, {
            features: {
              gfm: false,
              frontmatter: false,
              smartPunctuation: false
            },
            mdastPlugins: [satteriAbbr(), satteriDel()]
          }).html
        )
    ]
  ] as const;

  describe.each(renders)("%s", (_engine, render) => {
    it.each(cases)("%s", (_name, input, expected) => {
      expect(render(definition + input)).toBe(expected);
    });
  });
});

describe("private-use characters the author typed survive the scans", () => {
  // Escaped characters are swapped for Supplementary Private Use Area-A stand-ins while a scan runs. Those are real code points (Nerd Fonts puts icons there), so restoring the stand-ins must not rewrite the author's own to ASCII.
  const cases: [name: string, input: string, expected: string[]][] = [
    ["in a fenced code block", "```\n\u{F003C}\n```", ["\u{F003C}"]],
    [
      "in inline code beside a span",
      "`\u{F003C}` --a--",
      ["<code>\u{F003C}</code>", "<del>a</del>"]
    ],
    [
      "in the text a span is found in",
      "\u{F003C}b\u{F003E} --a--",
      ["<p>\u{F003C}b\u{F003E} <del>a</del></p>"]
    ],
    [
      "where they would decode to the marker itself",
      "\u{F002D}\u{F002D}a\u{F002D}\u{F002D} --b--",
      ["<p>\u{F002D}\u{F002D}a\u{F002D}\u{F002D} <del>b</del></p>"]
    ]
  ];

  describe.each(engines)("%s", (_engine, render) => {
    it.each(cases)("%s", (_name, input, expected) => {
      const html = render(input);
      for (const part of expected) expect(html).toContain(part);
    });
  });
});

describe("a hard break after a run: how the break was written decides whether the run can open", () => {
  // markdown-it reads the source character after a run. A break written as a backslash puts punctuation there, so a run after punctuation still opens; one written as two spaces puts a space there, so the run opens nothing. The tree holds the same `break` node for both, and remark and Sätteri have to look at the source to tell them apart.
  const cases: [name: string, input: string, expected: string][] = [
    [
      "a backslash break after a run that follows punctuation lets it open",
      "(--\\\na--",
      "<p>(<del><br>\na</del></p>"
    ],
    [
      "the same inside emphasis",
      "*(++\\\na++*",
      "<p><em>(<ins><br>\na</ins></em></p>"
    ],
    [
      "the same in a block quote, where the next line has a marker of its own",
      "> (==\\\n> a==",
      "<blockquote><p>(<mark><br>\na</mark></p></blockquote>"
    ],
    [
      "a backslash break after a run that follows a letter opens nothing",
      "x--\\\na--",
      "<p>x--<br>\na--</p>"
    ],
    [
      "a two-space break after a run is a space, so the run opens nothing",
      "(--  \na--",
      "<p>(--<br>\na--</p>"
    ],
    [
      "a break before a run is a line ending however it was written",
      "--a\\\n--)",
      "<p>--a<br>\n--)</p>"
    ]
  ];

  describe.each(engines)("%s", (_engine, render) => {
    it.each(cases)("%s", (_name, input, expected) => {
      expect(render(input)).toBe(expected);
    });
  });
});

describe("nesting stops at 100 spans, so one deep run can't make Sätteri reject the whole document", () => {
  // Sätteri throws on content nested deeper than 128 levels, where markdown-it and remark would render any depth. All three stop at markdown-it's own nesting limit instead, as keys do, and leave the markers of deeper pairs as text: the outer 100 pairs still form.
  const nested = (marker: string, depth: number): string =>
    `${marker.repeat(depth)}a${marker.repeat(depth)}`;
  const spans: [marker: string, tag: string][] = [
    ["--", "del"],
    ["++", "ins"],
    ["==", "mark"]
  ];

  describe.each(engines)("%s", (_engine, render) => {
    it.each(spans)("%s: 100 nested spans all form", (marker, tag) => {
      expect(render(nested(marker, 100))).toBe(
        `<p>${`<${tag}>`.repeat(100)}a${`</${tag}>`.repeat(100)}</p>`
      );
    });

    it.each(spans)(
      "%s: the pairs past the 100th stay markers",
      (marker, tag) => {
        expect(render(nested(marker, 150))).toBe(
          `<p>${`<${tag}>`.repeat(100)}${marker.repeat(50)}a${marker.repeat(50)}${`</${tag}>`.repeat(100)}</p>`
        );
      }
    );

    it.each(spans)(
      "%s: spans side by side are not nested, however many",
      (marker, tag) => {
        expect(render(Array(150).fill(`${marker}a${marker}`).join(" "))).toBe(
          `<p>${Array(150).fill(`<${tag}>a</${tag}>`).join(" ")}</p>`
        );
      }
    );

    it.each(spans)(
      "%s: a span after a run that hit the limit still forms",
      (marker, tag) => {
        expect(render(`${nested(marker, 101)} ${marker}b${marker}`)).toBe(
          `<p>${`<${tag}>`.repeat(100)}${marker}a${marker}${`</${tag}>`.repeat(100)} <${tag}>b</${tag}></p>`
        );
      }
    );
  });
});

describe("image alt text: a known difference between the engines", () => {
  // markdown-it runs inline rules inside an image label and renders the alt from the result, so the markers are gone. In mdast the alt is a string the parser wrote, which no plugin scans. Pinned so that closing the gap, or widening it, is a deliberate change (the guide documents it).
  const input = "![--a--](x.png)";

  it("markdown-it drops the markers", () => {
    expect(mdit(input)).toBe('<p><img src="x.png" alt="a"></p>');
  });

  it.each([
    ["remark", remd],
    ["sätteri", sat]
  ] as const)("%s keeps the alt as written", (_engine, render) => {
    expect(render(input)).toBe('<p><img src="x.png" alt="--a--"></p>');
  });
});
