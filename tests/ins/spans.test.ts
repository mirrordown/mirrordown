import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { del } from "../../packages/mdit-del/src";
import { ins } from "../../packages/mdit-ins/src";
import { mark } from "../../packages/mdit-mark/src";
import { abbr } from "../../packages/mdit-abbr/src";
import { remarkDel } from "../../packages/remd-del/src";
import { remarkIns } from "../../packages/remd-ins/src";
import { remarkMark } from "../../packages/remd-mark/src";
import { remarkAbbr } from "../../packages/remd-abbr/src";
import { satteriDel } from "../../packages/sat-del/src";
import { satteriIns } from "../../packages/sat-ins/src";
import { satteriMark } from "../../packages/sat-mark/src";
import { satteriAbbr } from "../../packages/sat-abbr/src";
import { normalizeHtml } from "../utils/index.js";

// markdown-it reads the raw source and scans every marker in one pass; remark and Sätteri scan resolved text, one marker per plugin, in the order del, ins, mark the presets use. These cases hold the `+` marker to markdown-it's result wherever the two models could drift apart, and pin the places where they are known to.

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

describe("ins beside other span plugins: an escape outlives the scan before it", () => {
  const cases: Case[] = [
    [
      "an escaped ins after a del span stays literal",
      String.raw`--x-- \++b++`,
      "<p><del>x</del> ++b++</p>"
    ],
    [
      "an escaped mark after an ins span stays literal",
      String.raw`++x++ \==b==`,
      "<p><ins>x</ins> ==b==</p>"
    ],
    [
      "an escaped ins after an ins span stays literal",
      String.raw`++a ++b++ c++ \++d++`,
      "<p><ins>a <ins>b</ins> c</ins> ++d++</p>"
    ]
  ];

  describe.each(engines)("%s", (_engine, render) => {
    it.each(cases)("%s", (_name, input, expected) => {
      expect(render(input)).toBe(expected);
    });
  });
});

describe("ins flanking: an escaped character beside a run counts as punctuation", () => {
  // markdown-it sees the backslash after a run and the escaped character before one, both ASCII punctuation, and that decides whether the run can open or close.
  const cases: Case[] = [
    [
      "a run after punctuation closes before an escape",
      String.raw`++a.++\*b`,
      "<p><ins>a.</ins>*b</p>"
    ],
    [
      "a run after a letter does not open before an escape",
      String.raw`x++\*a++`,
      "<p>x++*a++</p>"
    ],
    [
      "a run after an escape opens before punctuation",
      String.raw`\*++.a++`,
      "<p>*<ins>.a</ins></p>"
    ],
    [
      "an escaped plus splits a run and is not part of either half",
      String.raw`++a\+++b++`,
      "<p>++a+<ins>b</ins></p>"
    ]
  ];

  describe.each(engines)("%s", (_engine, render) => {
    it.each(cases)("%s", (_name, input, expected) => {
      expect(render(input)).toBe(expected);
    });
  });
});

describe("ins and character references: a reference is never a delimiter", () => {
  // A plus written as a reference is text, and for flanking markdown-it sees the `&` and `;` of any reference, not the character it decodes to.
  const cases: Case[] = [
    [
      "numeric references for every plus stay literal",
      "&#43;&#43;x&#43;&#43;",
      "<p>++x++</p>"
    ],
    [
      "named references for every plus stay literal",
      "&plus;&plus;x&plus;&plus;",
      "<p>++x++</p>"
    ],
    [
      "a reference does not complete an opening run",
      "+&#43;x++",
      "<p>++x++</p>"
    ],
    [
      "a reference does not complete a closing run",
      "++x+&#43;",
      "<p>++x++</p>"
    ],
    [
      "a run after punctuation closes before a letter reference",
      "++a.++&#97;",
      "<p><ins>a.</ins>a</p>"
    ],
    [
      "a run after a letter reference opens before punctuation",
      "&#97;++.b++",
      "<p>a<ins>.b</ins></p>"
    ],
    [
      "an escape after a reference to an astral character is honoured",
      String.raw`&#x1F600; \++a++`,
      "<p>\u{1F600} ++a++</p>"
    ],
    [
      "an escape after a reference to two code points is honoured",
      String.raw`&NotEqualTilde; \++a++`,
      "<p>≂̸ ++a++</p>"
    ]
  ];

  describe.each(engines)("%s", (_engine, render) => {
    it.each(cases)("%s", (_name, input, expected) => {
      expect(render(input)).toBe(expected);
    });

    it("an escape after a NUL the parser replaced is honoured", () => {
      // Each engine writes the replaced NUL its own way, so only the pairing is compared.
      const html = render("a\u0000 " + String.raw`\++b++`);
      expect(html).toContain("++b++");
      expect(html).not.toContain("<ins>");
    });
  });
});

describe("ins beside an abbreviation: the abbreviation is plain text for flanking", () => {
  // markdown-it applies abbreviations after inline parsing, so a run beside one sees a letter; remark and Sätteri replace the term with an `abbr` node before ins runs.
  const definition = "*[HTML]: Hyper Text\n\n";
  const cases: Case[] = [
    [
      "a run between a letter and a term opens",
      "a++HTML++",
      '<p>a<ins><abbr title="Hyper Text">HTML</abbr></ins></p>'
    ],
    [
      "a run between a term and punctuation does not open",
      "HTML++.a++",
      '<p><abbr title="Hyper Text">HTML</abbr>++.a++</p>'
    ]
  ];

  const abbrMd = new MarkdownIt().use(abbr).use(ins);
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
              .use(remarkIns)
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
            mdastPlugins: [satteriAbbr(), satteriIns()]
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

describe("ins and literal contexts: text that is not prose is not scanned", () => {
  const cases: Case[] = [
    [
      "an autolink shows its URL as written",
      "<http://x.y/++b++>",
      '<p><a href="http://x.y/++b++">http://x.y/++b++</a></p>'
    ],
    [
      "a run inside inline code does not close a span",
      "++a `b++` c++",
      "<p><ins>a <code>b++</code> c</ins></p>"
    ],
    [
      "a span does not cross out of a link label",
      "[a ++b](http://x.y) c++",
      '<p><a href="http://x.y">a ++b</a> c++</p>'
    ],
    [
      "a plus that is a list marker is not part of a run",
      "+ +++a+++",
      "<ul><li>+<ins>a</ins>+</li></ul>"
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
      "an ins span crossing emphasis",
      "++a *b++ c*",
      "<p><ins>a *b</ins> c*</p>",
      "<p>++a <em>b++ c</em></p>"
    ],
    [
      "an ins span crossing a del span",
      "++a --b++ c--",
      "<p><ins>a --b</ins> c--</p>",
      "<p>++a <del>b++ c</del></p>"
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
  const input = "![++a++](x.png)";

  it("markdown-it drops the markers", () => {
    expect(mdit(input)).toBe('<p><img src="x.png" alt="a"></p>');
  });

  it.each([
    ["remark", remd],
    ["sätteri", sat]
  ] as const)("%s keeps the alt as written", (_engine, render) => {
    expect(render(input)).toBe('<p><img src="x.png" alt="++a++"></p>');
  });
});
