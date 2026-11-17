// The cases every inline span a plugin builds (del, ins, mark, kbd, spoiler, ruby) is held to when an attribute block is written right after it. markdown-it and remark run their attrs plugins once the span exists, so the block goes on the span. Sätteri reads attribute blocks while it parses, before any plugin has built the span: it leaves a block in the middle of a paragraph as text, and gives one that ends the paragraph to the paragraph, or to the list item, heading or table cell that holds it. The Sätteri span plugins take both back, and these cases are what "back" means: the same HTML as the other two engines.

export type SpanAttrsCase = [name: string, input: string, expected: string];

/** How one plugin set writes its span and renders it. */
export interface SpanSyntax {
  /** The span's source, e.g. `--x--`. */
  span: string;
  /** The span's source inside a GFM table cell, where it differs (a `|` is written `\|` there). */
  cellSpan?: string;
  /** The span's HTML, given the attributes written on it (` class="a"`, or an empty string). */
  html: (attributes: string) => string;
}

const table = (cell: string): string => `| h |\n| - |\n| ${cell} |`;
const cell = (attributes: string, content: string): string =>
  `<table><thead><tr><th>h</th></tr></thead><tbody><tr><td${attributes}>${content}</td></tr></tbody></table>`;

/** Cases whose block is the span's, or is not, by where it is written. */
export const spanAttrsCases = ({
  span,
  cellSpan = span,
  html
}: SpanSyntax): SpanAttrsCase[] => [
  [
    `a block that ends the paragraph, touching the span, is the span's`,
    `${span}{.c}`,
    `<p>${html(` class="c"`)}</p>`
  ],
  [
    `a block before more text is the span's, and the text stays`,
    `${span}{.c} tail`,
    `<p>${html(` class="c"`)} tail</p>`
  ],
  [
    `a block after a space is the paragraph's`,
    `${span} {.c}`,
    `<p class="c">${html(``)}</p>`
  ],
  [
    `an id, a class and a key all go on the span`,
    `${span}{#i .c k=v}`,
    `<p>${html(` id="i" class="c" k="v"`)}</p>`
  ],
  [
    `two touching blocks both go on the span, mid-paragraph`,
    `${span}{.a}{.b} tail`,
    `<p>${html(` class="a b"`)} tail</p>`
  ],
  [
    `two touching blocks both go on the span, at the end`,
    `${span}{.a}{.b}`,
    `<p>${html(` class="a b"`)}</p>`
  ],
  [
    `a touching block is the span's and a spaced one after it the paragraph's`,
    `${span}{.a} {.p}`,
    `<p class="p">${html(` class="a"`)}</p>`
  ],
  [
    `a touching block is the span's and one on the next line the paragraph's`,
    `${span}{.a}\n{.p}`,
    `<p class="p">${html(` class="a"`)}</p>`
  ],
  [
    `each of two spans takes its own block`,
    `a ${span}{.c} b ${span}{.d}`,
    `<p>a ${html(` class="c"`)} b ${html(` class="d"`)}</p>`
  ],
  [
    `a block after a span on an earlier line is the span's`,
    `${span}{.c}\nmore`,
    `<p>${html(` class="c"`)}\nmore</p>`
  ],
  [
    `a block inside emphasis is the span's`,
    `*${span}{.c}* tail`,
    `<p><em>${html(` class="c"`)}</em> tail</p>`
  ],
  [
    `a block after the emphasis around a span is the emphasis's`,
    `*${span}*{.c}`,
    `<p><em class="c">${html(``)}</em></p>`
  ],
  [
    `in a list item, a touching block is the span's and not the item's`,
    `- ${span}{.c}`,
    `<ul><li>${html(` class="c"`)}</li></ul>`
  ],
  [
    `in a list item, a block after a space is the item's`,
    `- ${span} {.c}`,
    `<ul><li class="c">${html(``)}</li></ul>`
  ],
  [
    `in a loose list item, a touching block is the span's`,
    `- a\n\n- ${span}{.c}`,
    `<ul><li><p>a</p></li><li><p>${html(` class="c"`)}</p></li></ul>`
  ],
  [
    `in a heading, a touching block is the span's and not the heading's`,
    `# ${span}{.c}`,
    `<h1>${html(` class="c"`)}</h1>`
  ],
  [
    `in a heading, a block after a space is the heading's`,
    `# ${span} {.c}`,
    `<h1 class="c">${html(``)}</h1>`
  ],
  [
    `in a heading underlined on the next line, a touching block is the span's`,
    `${span}{.c}\n===`,
    `<h1>${html(` class="c"`)}</h1>`
  ],
  [
    `in a blockquote, a touching block is the span's`,
    `> ${span}{.c}`,
    `<blockquote><p>${html(` class="c"`)}</p></blockquote>`
  ],
  [
    `in a table cell, a touching block is the span's and not the cell's`,
    table(`${cellSpan}{.c}`),
    cell(``, html(` class="c"`))
  ],
  // With a `|` in the cell this one is Sätteri's own to miss: see `escapedPipeCellCase`.
  ...(cellSpan === span
    ? ([
        [
          `in a table cell, a block after a space is the cell's`,
          table(`${span} {.c}`),
          cell(` class="c"`, html(``))
        ]
      ] satisfies SpanAttrsCase[])
    : []),
  [
    `in a table cell, a block before more text is the span's`,
    table(`${cellSpan}{.c} y`),
    cell(``, `${html(` class="c"`)} y`)
  ],
  [
    `braces that are not a block stay text`,
    `${span}{} and ${span}{.a`,
    `<p>${html(``)}{} and ${html(``)}{.a</p>`
  ]
];

/** Cases with the document's attribute blocks turned off, where a block is text in every engine. They are Sätteri's to run: its plugins must not read a block the parser was told not to. */
export const spanAttrsOffCases = ({
  span,
  html
}: SpanSyntax): SpanAttrsCase[] => [
  [
    `a block that ends the paragraph stays text`,
    `${span}{.c}`,
    `<p>${html(``)}{.c}</p>`
  ],
  [
    `a block before more text stays text`,
    `${span}{.c} tail`,
    `<p>${html(``)}{.c} tail</p>`
  ]
];

/**
 * An engine limit, for spans written with a `|` (a spoiler, a ruby): Sätteri's parser never reads the attribute block of a table cell that holds an escaped pipe, with or without plugins (`| a\|b {.c} |` keeps ` {.c}` as text), so a block that is the cell's stays text there. A block touching the span is still the span's (see the table-cell cases above).
 */
export const escapedPipeCellCase = ({
  cellSpan = ``,
  html
}: SpanSyntax): { input: string; expected: string; satteri: string } => ({
  input: table(`${cellSpan} {.c}`),
  expected: cell(` class="c"`, html(``)),
  satteri: cell(``, `${html(``)} {.c}`)
});
