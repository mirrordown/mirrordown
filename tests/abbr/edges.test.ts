import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Root } from "mdast";
import { markdownToHtml } from "satteri";
import {
  createAbbreviationScan,
  parseAbbreviations
} from "../../packages/core/src";
import { abbr } from "../../packages/mdit-abbr/src";
import { remarkAbbr } from "../../packages/remd-abbr/src";
import { satteriAbbr } from "../../packages/sat-abbr/src";
import { normalizeHtml } from "../utils/index.js";

const mdit = (input: string, env: object = {}): string =>
  normalizeHtml(new MarkdownIt().use(abbr).render(input, env));

const remd = (input: string): string =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkAbbr)
        .use(remarkRehype)
        .use(rehypeStringify)
        .processSync(input)
    )
  );

const sat = (input: string): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: { gfm: false, frontmatter: false, smartPunctuation: false },
      mdastPlugins: [satteriAbbr()]
    }).html
  );

// markdown-it keeps its terms as keys of a plain object. A term that named a member every object inherits was never stored, which left a table with no terms, and a table with no terms builds a pattern that matches the empty string at one place forever: text starting with punctuation hung the render. These inputs show the same fault without hanging, as an empty `<abbr>` in the output.
describe("mdit-abbr: a term can't empty the table, and an empty table does nothing", () => {
  // `_proto__` itself can't appear as a word in running text (its underscores are emphasis), so the inherited names that can are used here.
  it.each([`constructor`, `toString`, `hasOwnProperty`])(
    "defines %s like any other term",
    (term) => {
      expect(mdit(`*[${term}]: x\n\nuse ${term} now`)).toBe(
        `<p>use <abbr title="x">${term}</abbr> now</p>`
      );
    }
  );

  it("leaves text alone when the only definition names an inherited member", () => {
    expect(mdit(`*[_proto__]: x\n\nplain  words here.`)).toBe(
      `<p>plain  words here.</p>`
    );
  });

  it("leaves text alone when the caller's env carries a table with no terms", () => {
    expect(mdit(`plain  words here.`, { abbreviations: {} })).toBe(
      `<p>plain  words here.</p>`
    );
  });
});

// Definitions are read a line at a time, and a document saved with Windows line endings is the same document.
describe("abbr definitions end at any line ending", () => {
  it("reads one definition per line whatever ends the line", () => {
    const expected = [
      [`A`, `one`],
      [`B`, `two`]
    ];
    expect(parseAbbreviations(`*[A]: one\n*[B]: two`)).toEqual(expected);
    expect(parseAbbreviations(`*[A]: one\r\n*[B]: two`)).toEqual(expected);
    expect(parseAbbreviations(`*[A]: one\r*[B]: two`)).toEqual(expected);
  });

  it.each([
    [`markdown-it`, mdit],
    [`remark`, remd],
    [`sätteri`, sat]
  ] as const)(
    "%s: two definitions on CRLF lines both apply",
    (_engine, render) => {
      expect(render(`*[A]: one\r\n*[B]: two\r\n\r\nA and B`)).toBe(
        `<p><abbr title="one">A</abbr> and <abbr title="two">B</abbr></p>`
      );
    }
  );
});

const engines = [
  [`markdown-it`, mdit],
  [`remark`, remd],
  [`sätteri`, sat]
] as const;

// Where a term may stand is markdown-it-abbr's rule, which the markdown-it plugin keeps: between the edges of the text, punctuation, spaces and a few ASCII symbols. remark and Sätteri once used `\b`, which never matched a term edged with a symbol or a non-ASCII letter and took any non-ASCII letter for a boundary. The shared fixture holds the everyday cases; these are the ones a looser rule gets wrong.
describe("abbr: a term stands between the same boundaries in every engine", () => {
  const cases: [name: string, input: string, expected: string][] = [
    [
      `a tab is not a boundary`,
      `*[HTML]: Hyper\n\nHTML\tfoo and\tHTML`,
      `<p>HTML\tfoo and\tHTML</p>`
    ],
    [
      `a term can't start where the last one ended, even if that one ends with a boundary character`,
      `*[a+]: one\n*[+]: two\n\na++ and + here`,
      `<p><abbr title="one">a+</abbr>+ and <abbr title="two">+</abbr> here</p>`
    ],
    [
      `a shorter term matches where the longer one runs into a word`,
      `*[HT]: one\n*[HTML]: two\n\nHT HTML HT-ML HTMLx`,
      `<p><abbr title="one">HT</abbr> <abbr title="two">HTML</abbr> <abbr title="one">HT</abbr>-ML HTMLx</p>`
    ],
    [
      `a character outside the BMP is one character, in a term and next to one`,
      `*[𝔸]: double-struck\n\n𝔸 x𝔸 𝔸𝔸 (𝔸)`,
      `<p><abbr title="double-struck">𝔸</abbr> x𝔸 𝔸𝔸 (<abbr title="double-struck">𝔸</abbr>)</p>`
    ]
  ];

  describe.each(engines)("%s", (_engine, render) => {
    it.each(cases)("%s", (_name, input, expected) => {
      expect(render(input)).toBe(expected);
    });
  });
});

// markdown-it holds an escaped character or a character reference in a token of its own until `text_join`. The abbreviation rule reads such a run as one text (the shared fixture has those cases) but stays ahead of the typographer, so a term is found as it was written, and what was escaped is still escaped when the typographer runs.
describe("mdit-abbr: abbreviations are found before the typographer runs", () => {
  const typographer = (input: string): string =>
    normalizeHtml(
      new MarkdownIt({ typographer: true }).use(abbr).render(input)
    );

  it("finds a term holding characters the typographer rewrites", () => {
    expect(typographer(`*[rock'n'roll]: music\n\nrock'n'roll here`)).toBe(
      `<p><abbr title="music">rock’n’roll</abbr> here</p>`
    );
  });

  it("leaves an escaped quote next to a term straight, and curls a plain one", () => {
    expect(typographer(`*[HTML]: Hyper\n\n\\"HTML\\" and "HTML"`)).toBe(
      `<p>"<abbr title="Hyper">HTML</abbr>" and “<abbr title="Hyper">HTML</abbr>”</p>`
    );
  });

  it("leaves an escaped character inside a term to the typographer as escaped", () => {
    expect(typographer(`*[a"b]: t\n\nsee a\\"b now`)).toBe(
      `<p>see <abbr title="t">a"b</abbr> now</p>`
    );
  });
});

// markdown-it asks the definition rule, in silent mode, whether a line ends the paragraph above it. It used to say yes before checking that the line had a term and a title, so a line that is not a definition still split the paragraph.
describe("abbr: a line that is not a definition does not end a paragraph", () => {
  describe.each(engines)("%s", (_engine, render) => {
    it.each([
      [`no title`, `*[X]:`],
      [`no term`, `*[]: t`]
    ])("a line with %s stays in the paragraph around it", (_name, line) => {
      expect(render(`foo\n${line}\nbar`)).toBe(`<p>foo\n${line}\nbar</p>`);
    });
  });
});

// A KNOWN DIFFERENCE, pinned so it can't drift unnoticed, not a contract. markdown-it reads a definition a line at a time, as markdown-it-abbr does, so a definition line can sit directly against other text. remark and Sätteri see finished paragraphs, and take one as definitions only when every line of it is a definition. The guide tells authors to keep definitions in a paragraph of their own, where all three agree. Which way to settle this is the owner's decision: if it changes, these expectations change with it.
describe("abbr: a definition line directly against other text (engines differ)", () => {
  const HTML = `<abbr title="Hyper Text">HTML</abbr>`;
  const cases: [
    name: string,
    input: string,
    lineBased: string,
    paragraphBased: string
  ][] = [
    [
      `after a line of text`,
      `The HTML spec.\n*[HTML]: Hyper Text`,
      `<p>The ${HTML} spec.</p>`,
      `<p>The HTML spec.\n*[HTML]: Hyper Text</p>`
    ],
    [
      `before a line of text`,
      `*[HTML]: Hyper Text\nThe HTML spec.`,
      `<p>The ${HTML} spec.</p>`,
      `<p>*[HTML]: Hyper Text\nThe HTML spec.</p>`
    ],
    [
      `above a setext underline`,
      `*[HTML]: Hyper Text\n===\n\nHTML`,
      `<p>===</p><p>${HTML}</p>`,
      `<h1>*[HTML]: Hyper Text</h1><p>HTML</p>`
    ]
  ];

  it.each(cases)("%s", (_name, input, lineBased, paragraphBased) => {
    expect(mdit(input)).toBe(lineBased);
    expect(remd(input)).toBe(paragraphBased);
    expect(sat(input)).toBe(paragraphBased);
  });
});

// A term is what stands between the brackets without the space around it, and a definition needs a term and a title. markdown-it kept the space (so ` HTML ` never matched) while remark and Sätteri matched it with the space inside the `<abbr>`, and a blank term wrapped single spaces. The scan is also given a table by its callers: one with no term to look for builds a pattern that matches the empty string at every boundary.
describe("abbr: a definition needs a term and a title, without the space around them", () => {
  describe.each(engines)("%s", (_engine, render) => {
    it("takes the term without the space inside the brackets", () => {
      expect(render(`*[ HTML ]: t\n\nx HTML y`)).toBe(
        `<p>x <abbr title="t">HTML</abbr> y</p>`
      );
    });

    it("takes the title without the space before it, a tab included", () => {
      expect(render(`*[RD]:\tResearch\n\nRD`)).toBe(
        `<p><abbr title="Research">RD</abbr></p>`
      );
    });

    it("prints a line whose term is blank, and wraps no spaces", () => {
      expect(render(`*[ ]: x\n\na b c. (d)`)).toBe(
        `<p>*[ ]: x</p><p>a b c. (d)</p>`
      );
    });
  });

  it("finds nothing in any text when the table has no term to look for", () => {
    expect(createAbbreviationScan(new Map())(`a b (c)`)).toBeUndefined();
    expect(
      createAbbreviationScan(new Map([[``, `x`]]))(`a b (c)`)
    ).toBeUndefined();
  });

  it("reads a paragraph with a blank term or a blank title as ordinary text", () => {
    expect(parseAbbreviations(`*[ ]: x`)).toBeUndefined();
    expect(parseAbbreviations(`*[A]: one\n*[B]: \u00a0`)).toBeUndefined();
    expect(parseAbbreviations(`*[ A ]:  one `)).toEqual([[`A`, `one`]]);
  });
});

// markdown-it reads a definition from its source line, before any inline parsing. remark and Sätteri see the parsed paragraph, and once took it as definitions only when it was a single text node: a title or a term holding anything the parser turns into a node (emphasis, a link, a hard break) left the definition printed on the page and its term unmarked. They now read the paragraph's source too. The shared fixture has the everyday cases; these are about where that source comes from.
describe("abbr: a definition is read from its source line", () => {
  describe.each(engines)("%s", (_engine, render) => {
    it("reads each line of a paragraph the parser split at a hard break", () => {
      expect(render(`*[A]: first  \n*[B]: second\n\nA B`)).toBe(
        `<p><abbr title="first">A</abbr> <abbr title="second">B</abbr></p>`
      );
    });

    it("reads past the markers of the block a later line is in", () => {
      expect(render(`> - *[A]: *one*\n>   *[B]: two\n\nA B`)).toBe(
        `<blockquote><ul><li></li></ul></blockquote><p><abbr title="*one*">A</abbr> <abbr title="two">B</abbr></p>`
      );
    });
  });

  it("remark: reads the paragraph's text when the tree is transformed without its file", () => {
    const processor = unified()
      .use(remarkParse)
      .use(remarkAbbr)
      .use(remarkRehype)
      .use(rehypeStringify);
    const tree = processor.parse(`*[HTML]: Hyper Text\n\nHTML`);
    expect(processor.stringify(processor.runSync(tree))).toBe(
      `<p><abbr title="Hyper Text">HTML</abbr></p>`
    );
  });

  it("takes the source over the text, and the text where there is no source", () => {
    // The parser resolved the escape, so the text alone looks like a definition.
    expect(parseAbbreviations(`*[X]: t`, `\\*[X]: t`)).toBeUndefined();
    expect(parseAbbreviations(undefined, `*[X]: *t*`)).toEqual([[`X`, `*t*`]]);
    expect(parseAbbreviations(`*[X]: t`)).toEqual([[`X`, `t`]]);
    expect(parseAbbreviations(undefined)).toBeUndefined();
  });
});

// Smart punctuation rewrites quotes and dashes: in markdown-it after abbreviations are found, in remark (Astro adds `remark-smartypants` before a site's own plugins) and in Sätteri before any plugin runs. A term written with an apostrophe has to be found either way, so remark and Sätteri also look for the term as the parser left it. The title stays as written, as in markdown-it.
describe("abbr: a term holding a quote is found with smart punctuation on", () => {
  const input = `*[Int'l]: Int'l Business\n\nAn Int'l call`;
  const expected = `<p>An <abbr title="Int'l Business">Int’l</abbr> call</p>`;

  it("markdown-it", () => {
    expect(
      normalizeHtml(
        new MarkdownIt({ typographer: true }).use(abbr).render(input)
      )
    ).toBe(expected);
  });

  it("remark", () => {
    // What `remark-smartypants` does to an apostrophe, without depending on it here.
    const curlApostrophes = () => (tree: Root) => {
      visit(tree, "text", (node) => {
        node.value = node.value.replaceAll(`'`, `’`);
      });
    };
    expect(
      normalizeHtml(
        String(
          unified()
            .use(remarkParse)
            .use(curlApostrophes)
            .use(remarkAbbr)
            .use(remarkRehype)
            .use(rehypeStringify)
            .processSync(input)
        )
      )
    ).toBe(expected);
  });

  it("sätteri", () => {
    expect(
      normalizeHtml(
        markdownToHtml(input, {
          features: { gfm: false, frontmatter: false, smartPunctuation: true },
          mdastPlugins: [satteriAbbr()]
        }).html
      )
    ).toBe(expected);
  });
});

// markdown-it keeps a term as its source line has it and looks for it in text whose references are already decoded, so a term written with a character reference names the reference's own characters, not the character it stands for. remark and Sätteri look for a term as the parser left it only to undo smart punctuation; doing it for a decoded reference marked text markdown-it leaves alone.
describe("abbr: a term written with a character reference is the characters as written", () => {
  describe.each(engines)("%s", (_engine, render) => {
    it("does not mark the character the reference stands for", () => {
      expect(render(`*[A&amp;B]: x\n\nA&B and A&amp;B`)).toBe(
        `<p>A&amp;B and A&amp;B</p>`
      );
    });

    it("marks text that spells the reference out", () => {
      expect(render(`*[A&amp;B]: x\n\nsee A&amp;amp;B here`)).toBe(
        `<p>see <abbr title="x">A&amp;amp;B</abbr> here</p>`
      );
    });
  });

  it("looks for the parser's term only where smart punctuation made the difference", () => {
    expect(parseAbbreviations(`*[A&B]: x`, `*[A&amp;B]: x`)).toEqual([
      [`A&amp;B`, `x`]
    ]);
    expect(parseAbbreviations(`*[Int’l]: x`, `*[Int'l]: x`)).toEqual([
      [`Int'l`, `x`],
      [`Int’l`, `x`]
    ]);
    expect(parseAbbreviations(`*[a–b… “c”]: x`, `*[a--b... "c"]: x`)).toEqual([
      [`a--b... "c"`, `x`],
      [`a–b… “c”`, `x`]
    ]);
  });
});

// Behaviour the engines already share and nothing else holds in place. The shared fixture runs through the presets too, where a code block and an image get other plugins' markup, so those two are here.
describe("abbr: what is never a definition or a term", () => {
  describe.each(engines)("%s", (_engine, render) => {
    it("leaves a definition line inside a code block as code, and defines nothing", () => {
      expect(render("```\n*[HTML]: Hyper Text\n```\n\nHTML")).toBe(
        `<pre><code>*[HTML]: Hyper Text\n</code></pre><p>HTML</p>`
      );
    });

    it("leaves a term inside a code block alone", () => {
      expect(render("*[HTML]: Hyper Text\n\n```\nHTML fenced\n```")).toBe(
        `<pre><code>HTML fenced\n</code></pre>`
      );
    });

    it("leaves a term in an image's alt text and title alone", () => {
      expect(render(`*[HTML]: Hyper Text\n\n![HTML](HTML.png "HTML")`)).toBe(
        `<p><img src="HTML.png" alt="HTML" title="HTML"></p>`
      );
    });
  });
});

// Each engine keeps its table of terms somewhere: markdown-it in the render's `env`, remark in the transformer call, Sätteri in the plugin instance, reset before each document. A site renders many pages with one instance, and a term defined on one page must not be marked on the next.
describe("abbr: definitions do not carry over to the next document", () => {
  const first = `*[HTML]: Hyper Text\n\nHTML`;
  const second = `HTML`;
  const marked = `<p><abbr title="Hyper Text">HTML</abbr></p>`;
  const plain = `<p>HTML</p>`;

  it("markdown-it", () => {
    const md = new MarkdownIt().use(abbr);
    expect(normalizeHtml(md.render(first))).toBe(marked);
    expect(normalizeHtml(md.render(second))).toBe(plain);
  });

  it("remark", () => {
    const processor = unified()
      .use(remarkParse)
      .use(remarkAbbr)
      .use(remarkRehype)
      .use(rehypeStringify);
    expect(normalizeHtml(String(processor.processSync(first)))).toBe(marked);
    expect(normalizeHtml(String(processor.processSync(second)))).toBe(plain);
  });

  it("sätteri", () => {
    const options = { mdastPlugins: [satteriAbbr()] };
    expect(normalizeHtml(markdownToHtml(first, options).html)).toBe(marked);
    expect(normalizeHtml(markdownToHtml(second, options).html)).toBe(plain);
  });
});
