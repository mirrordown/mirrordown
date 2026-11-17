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
import { spoiler } from "../../packages/mdit-spoiler/src";
import { abbr } from "../../packages/mdit-abbr/src";
import { remarkDel } from "../../packages/remd-del/src";
import { remarkIns } from "../../packages/remd-ins/src";
import { remarkKbd } from "../../packages/remd-kbd/src";
import { remarkMark } from "../../packages/remd-mark/src";
import { remarkSpoiler } from "../../packages/remd-spoiler/src";
import { remarkAbbr } from "../../packages/remd-abbr/src";
import { satteriDel } from "../../packages/sat-del/src";
import { satteriIns } from "../../packages/sat-ins/src";
import { satteriKbd } from "../../packages/sat-kbd/src";
import { satteriMark } from "../../packages/sat-mark/src";
import { satteriSpoiler } from "../../packages/sat-spoiler/src";
import { satteriAbbr } from "../../packages/sat-abbr/src";
import { normalizeHtml } from "../utils/index.js";

// markdown-it reads the raw source and scans every marker in one pass; remark and Sätteri scan resolved text, one marker per plugin, in the order del, ins, mark the presets use. These cases hold the `=` marker to markdown-it's result wherever the two models could drift apart, and pin the places where they are known to.

const satFeatures = { gfm: false, frontmatter: false, smartPunctuation: false };

const md = new MarkdownIt().use(del).use(ins).use(mark);
const mdit = (input: string): string => normalizeHtml(md.render(input));

const remarkProcessor = unified()
  .use(remarkParse)
  .use(remarkDel)
  .use(remarkIns)
  .use(remarkMark)
  .use(remarkRehype)
  .use(rehypeStringify);
const remd = (input: string): string =>
  normalizeHtml(String(remarkProcessor.processSync(input)));

const sat = (input: string): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: satFeatures,
      mdastPlugins: [satteriDel(), satteriIns(), satteriMark()]
    }).html
  );

const engines = [
  ["markdown-it", mdit],
  ["remark", remd],
  ["sätteri", sat]
] as const;

type Case = [name: string, input: string, expected: string];

describe("mark beside other span plugins: an escape outlives the scan before it", () => {
  // Every plugin that forms a span rebuilds the paragraph's text, and the plugins after it still have to tell `\==` from `==`. Del, ins and kbd run before mark here so that mark is the one reading rebuilt text, and spoiler runs after it so that mark is the one that rebuilt it.
  const cases: Case[] = [
    [
      "an escaped mark after a del span stays literal",
      String.raw`--x-- \==b==`,
      "<p><del>x</del> ==b==</p>"
    ],
    [
      "an escaped mark after an ins span stays literal",
      String.raw`++x++ \==b==`,
      "<p><ins>x</ins> ==b==</p>"
    ],
    [
      "an escaped mark after a kbd span stays literal",
      String.raw`[[x]] \==b==`,
      "<p><kbd>x</kbd> ==b==</p>"
    ],
    [
      "an escaped mark after a mark span stays literal",
      String.raw`==a ==b== c== \==d==`,
      "<p><mark>a <mark>b</mark> c</mark> ==d==</p>"
    ],
    [
      "an escaped spoiler after a mark span stays literal",
      String.raw`==x== \||b||`,
      "<p><mark>x</mark> ||b||</p>"
    ]
  ];

  const wideMd = new MarkdownIt()
    .use(del)
    .use(ins)
    .use(kbd)
    .use(mark)
    .use(spoiler);
  const wideRemark = unified()
    .use(remarkParse)
    .use(remarkDel)
    .use(remarkIns)
    .use(remarkKbd)
    .use(remarkMark)
    .use(remarkSpoiler)
    .use(remarkRehype)
    .use(rehypeStringify);
  const renders = [
    ["markdown-it", (input: string) => normalizeHtml(wideMd.render(input))],
    [
      "remark",
      (input: string) => normalizeHtml(String(wideRemark.processSync(input)))
    ],
    [
      "sätteri",
      (input: string) =>
        normalizeHtml(
          markdownToHtml(input, {
            features: satFeatures,
            mdastPlugins: [
              satteriDel(),
              satteriIns(),
              satteriKbd(),
              satteriMark(),
              satteriSpoiler()
            ]
          }).html
        )
    ]
  ] as const;

  describe.each(renders)("%s", (_engine, render) => {
    it.each(cases)("%s", (_name, input, expected) => {
      expect(render(input)).toBe(expected);
    });
  });
});

describe("mark flanking: an escaped character beside a run counts as punctuation", () => {
  // markdown-it sees the backslash after a run and the escaped character before one, both ASCII punctuation, and that decides whether the run can open or close.
  const cases: Case[] = [
    [
      "a run after punctuation closes before an escape",
      String.raw`==a.==\*b`,
      "<p><mark>a.</mark>*b</p>"
    ],
    [
      "a run after a letter does not open before an escape",
      String.raw`x==\*a==`,
      "<p>x==*a==</p>"
    ],
    [
      "a run after an escape opens before punctuation",
      String.raw`\*==.a==`,
      "<p>*<mark>.a</mark></p>"
    ],
    [
      "an escaped equals sign splits a run and is not part of either half",
      String.raw`==a\===b==`,
      "<p>==a=<mark>b</mark></p>"
    ]
  ];

  describe.each(engines)("%s", (_engine, render) => {
    it.each(cases)("%s", (_name, input, expected) => {
      expect(render(input)).toBe(expected);
    });
  });
});

describe("mark and character references: a reference is never a delimiter", () => {
  // An equals sign written as a reference is text, and for flanking markdown-it sees the `&` and `;` of any reference, not the character it decodes to.
  const cases: Case[] = [
    [
      "numeric references for every equals sign stay literal",
      "&#61;&#61;x&#61;&#61;",
      "<p>==x==</p>"
    ],
    [
      "named references for every equals sign stay literal",
      "&equals;&equals;x&equals;&equals;",
      "<p>==x==</p>"
    ],
    [
      "a reference does not complete an opening run",
      "=&#61;x==",
      "<p>==x==</p>"
    ],
    [
      "a reference does not complete a closing run",
      "==x=&#61;",
      "<p>==x==</p>"
    ],
    [
      "a run after punctuation closes before a letter reference",
      "==a.==&#97;",
      "<p><mark>a.</mark>a</p>"
    ],
    [
      "a run after a letter reference opens before punctuation",
      "&#97;==.b==",
      "<p>a<mark>.b</mark></p>"
    ],
    [
      "an escape after a reference to an astral character is honoured",
      String.raw`&#x1F600; \==a==`,
      "<p>\u{1F600} ==a==</p>"
    ],
    [
      "an escape after a reference to two code points is honoured",
      String.raw`&NotEqualTilde; \==a==`,
      "<p>≂̸ ==a==</p>"
    ],
    [
      "an astral reference between two escapes loses neither",
      String.raw`a\_b &#x1F600; \==c== d`,
      "<p>a_b \u{1F600} ==c== d</p>"
    ]
  ];

  describe.each(engines)("%s", (_engine, render) => {
    it.each(cases)("%s", (_name, input, expected) => {
      expect(render(input)).toBe(expected);
    });

    it("an escape after a NUL the parser replaced is honoured", () => {
      // Each engine writes the replaced NUL its own way, so only the pairing is compared.
      const html = render("a\u0000 " + String.raw`\==b==`);
      expect(html).toContain("==b==");
      expect(html).not.toContain("<mark>");
    });
  });
});

describe("mark and private use characters: what the author typed is not rewritten", () => {
  // remark and Sätteri hide escaped characters from the scan by moving them into U+F0021–U+F007E, the range icon fonts use. A character the author typed there has to come out as it went in, not as the ASCII character the range stands for.
  const cases: Case[] = [
    [
      "private use characters standing where a delimiter would are kept",
      "\u{F003D}\u{F003D}a\u{F003D}\u{F003D}",
      "<p>\u{F003D}\u{F003D}a\u{F003D}\u{F003D}</p>"
    ],
    [
      "a private use character in inline code is kept",
      "`\u{F003C}` ==a==",
      "<p><code>\u{F003C}</code> <mark>a</mark></p>"
    ],
    [
      "private use characters in text that also has an escape are kept",
      "\u{F003C}b\u{F003E} " + String.raw`\* ==a==`,
      "<p>\u{F003C}b\u{F003E} * <mark>a</mark></p>"
    ]
  ];

  describe.each(engines)("%s", (_engine, render) => {
    it.each(cases)("%s", (_name, input, expected) => {
      expect(render(input)).toBe(expected);
    });
  });
});

describe("mark beside an abbreviation: the abbreviation is plain text for flanking", () => {
  // markdown-it applies abbreviations after inline parsing, so a run beside one sees a letter; remark and Sätteri replace the term with an `abbr` node before mark runs.
  const definition = "*[HTML]: Hyper Text\n\n";
  const cases: Case[] = [
    [
      "a run between a letter and a term opens",
      "a==HTML==",
      '<p>a<mark><abbr title="Hyper Text">HTML</abbr></mark></p>'
    ],
    [
      "a run between a term and punctuation does not open",
      "HTML==.a==",
      '<p><abbr title="Hyper Text">HTML</abbr>==.a==</p>'
    ]
  ];

  const abbrMd = new MarkdownIt().use(abbr).use(mark);
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
              .use(remarkMark)
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
            features: satFeatures,
            mdastPlugins: [satteriAbbr(), satteriMark()]
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

describe("mark and literal contexts: text that is not prose is not scanned", () => {
  const cases: Case[] = [
    [
      "an autolink shows its URL as written",
      "<http://x.y/==b==>",
      '<p><a href="http://x.y/==b==">http://x.y/==b==</a></p>'
    ],
    [
      "a run inside inline code does not close a span",
      "==a `b==` c==",
      "<p><mark>a <code>b==</code> c</mark></p>"
    ],
    [
      "a span does not cross out of a link label",
      "[a ==b](http://x.y) c==",
      '<p><a href="http://x.y">a ==b</a> c==</p>'
    ],
    [
      "an equals underline is a heading marker, not a run",
      "==a==\n===",
      "<h1><mark>a</mark></h1>"
    ]
  ];

  describe.each(engines)("%s", (_engine, render) => {
    it.each(cases)("%s", (_name, input, expected) => {
      expect(render(input)).toBe(expected);
    });
  });
});

describe("spans that cross: a known difference between the engines", () => {
  // Spans have to nest. markdown-it keeps one delimiter list, so the first closer to find its opener wins and the marker caught between them stays literal. remark and Sätteri have emphasis from the parser before any plugin runs, then one marker per plugin in order. Pinned so that closing the gap, or widening it, is a deliberate change (the guide documents it).
  const cases: [
    name: string,
    input: string,
    mditHtml: string,
    mdastHtml: string
  ][] = [
    [
      "a mark span crossing emphasis",
      "==a *b== c*",
      "<p><mark>a *b</mark> c*</p>",
      "<p>==a <em>b== c</em></p>"
    ],
    [
      "a mark span crossing a del span",
      "==a --b== c--",
      "<p><mark>a --b</mark> c--</p>",
      "<p>==a <del>b== c</del></p>"
    ]
  ];

  it.each(cases)(
    "%s: markdown-it closes the first span",
    (_name, input, html) => {
      expect(mdit(input)).toBe(html);
    }
  );

  describe.each([
    ["remark", remd],
    ["sätteri", sat]
  ] as const)("%s", (_engine, render) => {
    it.each(cases)(
      "%s: the span resolved first wins",
      (_name, input, _mditHtml, html) => {
        expect(render(input)).toBe(html);
      }
    );
  });
});

describe("image alt text: a known difference between the engines", () => {
  // markdown-it runs inline rules inside an image label and renders the alt from the result, so the markers are gone. In mdast the alt is a string the parser wrote, which no plugin scans. Pinned so that closing the gap, or widening it, is a deliberate change (the guide documents it).
  const input = "![==a==](x.png)";

  it("markdown-it drops the markers", () => {
    expect(mdit(input)).toBe('<p><img src="x.png" alt="a"></p>');
  });

  it.each([
    ["remark", remd],
    ["sätteri", sat]
  ] as const)("%s keeps the alt as written", (_engine, render) => {
    expect(render(input)).toBe('<p><img src="x.png" alt="==a=="></p>');
  });
});
