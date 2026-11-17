// Inputs just outside the shared fixture, written as strings because several depend on exact indentation, tabs or trailing spaces. Every engine test in this folder runs them, and `expected` is what Sätteri's built-in `definitionList` emits: it cannot be changed, so it is the reference the markdown-it and remark plugins are held to.

export interface ParityCase {
  name: string;
  input: string;
  expected: string;
  /** The case needs GFM tables: remark and Sätteri turn GFM on for it, and markdown-it has tables built in. */
  gfm?: boolean;
}

export const parityCases: ParityCase[] = [
  // A term is a paragraph, so a line that starts any other block cannot be one, wherever it sits in the list. markdown-it read later terms without asking its other block rules and swallowed their syntax into a `<dt>`.
  {
    name: "a heading after a definition is a heading, not a later term",
    input: "T\n: D\n\n# H\n: D2",
    expected: "<dl><dt>T</dt><dd>D</dd></dl><h1>H</h1><p>: D2</p>"
  },
  {
    name: "a heading directly after a definition ends the list",
    input: "T\n: D\n# H\n: D2",
    expected: "<dl><dt>T</dt><dd>D</dd></dl><h1>H</h1><p>: D2</p>"
  },
  {
    name: "a list item after a definition is a list, not a later term",
    input: "T\n: D\n\n- item\n: D2",
    expected: "<dl><dt>T</dt><dd>D</dd></dl><ul><li>item\n: D2</li></ul>"
  },
  {
    name: "a blockquote after a definition is a blockquote, not a later term",
    input: "T\n: D\n\n> q\n: D2",
    expected:
      "<dl><dt>T</dt><dd>D</dd></dl><blockquote><p>q\n: D2</p></blockquote>"
  },
  {
    name: "a fence after a definition keeps its content as code",
    input: "T\n: D\n\n```\n: D2\n```",
    expected: "<dl><dt>T</dt><dd>D</dd></dl><pre><code>: D2\n</code></pre>"
  },
  {
    name: "a thematic break after a definition is a rule, not a later term",
    input: "T\n: D\n\n***\n: D2",
    expected: "<dl><dt>T</dt><dd>D</dd></dl><hr><p>: D2</p>"
  },
  {
    name: "indented code after a definition is code, not a later term",
    input: "T\n:    D\n\n    x\n: D2",
    expected:
      "<dl><dt>T</dt><dd>D</dd></dl><pre><code>x\n</code></pre><p>: D2</p>"
  },
  {
    name: "an HTML block after a definition stays raw HTML",
    input: "T\n: D\n\n<div>\n: D2",
    expected: "<dl><dt>T</dt><dd>D</dd></dl><div>\n: D2"
  },
  // A line that is one inline tag starts an HTML block wherever it doesn't interrupt a paragraph, and a later term never follows one. markdown-it's HTML rule, asked in validation mode, only says whether its block may interrupt a paragraph, so the tag was taken for a term and wrapped in a `<dt>`.
  {
    name: "a lone inline tag after a definition is raw HTML, not a later term",
    input: "T\n: D\n\n<span>\n: D2",
    expected: "<dl><dt>T</dt><dd>D</dd></dl><span>\n: D2"
  },
  {
    name: "a lone closing tag after a definition is raw HTML too",
    input: "T\n: D\n\n</span>\n: D2",
    expected: "<dl><dt>T</dt><dd>D</dd></dl></span>\n: D2"
  },
  {
    name: "a lone inline tag right after a definition's code block is raw HTML",
    input: "T\n: ```\n  x\n  ```\n<span>\n: D2",
    expected:
      "<dl><dt>T</dt><dd><pre><code>x\n</code></pre></dd></dl><span>\n: D2"
  },
  {
    name: "an inline tag with text after it on its line is still a later term",
    input: "T\n: D\n\n<b>bold</b>\n: D2",
    expected: "<dl><dt>T</dt><dd>D</dd><dt><b>bold</b></dt><dd>D2</dd></dl>"
  },
  {
    name: "a link reference definition after a definition is not a later term",
    input: "T\n: D\n\n[foo]: /url\n: D2",
    expected: "<dl><dt>T</dt><dd>D</dd></dl><p>: D2</p>"
  },
  {
    name: "a plain paragraph line after a definition is still a later term",
    input: "T\n: D\n\nT2\n: D2",
    expected: "<dl><dt>T</dt><dd>D</dd><dt>T2</dt><dd>D2</dd></dl>"
  },

  // The marker line decides: once `: Def` follows the term, a `===` or `---` line below it belongs to the definition (or ends the list) and cannot reach back over the marker to make a setext heading of the term.
  {
    name: "a `===` line under a definition is its lazy continuation, not a setext underline",
    input: "Term\n: Def\n===",
    expected: "<dl><dt>Term</dt><dd>Def\n===</dd></dl>"
  },
  {
    name: "a `---` line under a definition is a thematic break after the list",
    input: "Term\n: Def\n---",
    expected: "<dl><dt>Term</dt><dd>Def</dd></dl><hr>"
  },
  {
    name: "a `===` line under a later term's definition does not make a heading either",
    input: "T\n: D\n\nT2\n: D2\n===",
    expected: "<dl><dt>T</dt><dd>D</dd><dt>T2</dt><dd>D2\n===</dd></dl>"
  },
  {
    name: "a setext heading whose underline comes before the marker is still a heading",
    input: "Term\n===\n: Def",
    expected: "<h1>Term</h1><p>: Def</p>"
  },

  // A marker may be indented up to three columns, like every block marker. Four or more is a paragraph continuation, or indented code after a blank line.
  {
    name: "a marker indented four columns continues the paragraph",
    input: "Term\n    : Def",
    expected: "<p>Term\n: Def</p>"
  },
  {
    name: "a marker indented with a tab continues the paragraph",
    input: "Term\n\t: Def",
    expected: "<p>Term\n: Def</p>"
  },
  {
    name: "a marker indented four columns after a blank line is indented code",
    input: "Term\n\n    : Def",
    expected: "<p>Term</p><pre><code>: Def\n</code></pre>"
  },
  {
    name: "a marker four columns past a definition's content column is indented code inside it",
    input: "T\n: D\n\n      : D2",
    expected:
      "<dl><dt>T</dt><dd><p>D</p><pre><code>: D2\n</code></pre></dd></dl>"
  },
  {
    name: "a marker indented three columns still starts a definition",
    input: "T\n   : D",
    expected: "<dl><dt>T</dt><dd>D</dd></dl>"
  },
  {
    name: "a marker two columns past a definition's content column nests a list",
    input: "T\n: D\n    : D2",
    expected: "<dl><dt>T</dt><dd><dl><dt>D</dt><dd>D2</dd></dl></dd></dl>"
  },

  // Tab stops are absolute columns. Inside a blockquote the `> ` prefix shifts them, so a tab after the marker reaches column 4 of the line, which is content column 2 of the quote.
  {
    name: "a tab after the marker in a blockquote stops at the line's tab stop, not the quote's",
    input: "> T\n> :\tD\n>\n>   more",
    expected:
      "<blockquote><dl><dt>T</dt><dd><p>D</p><p>more</p></dd></dl></blockquote>"
  },
  {
    name: "a tab after the marker at the top level sets the content column to the tab stop",
    input: "T\n:\tD\n\n  more",
    expected: "<dl><dt>T</dt><dd>D</dd></dl><p>more</p>"
  },

  // A blank line before the marker makes the definition loose wherever the marker sits: its own indent, or the indent of a list item or an enclosing definition, does not hide the blank.
  {
    name: "a blank line before an indented marker makes the definition loose",
    input: "T\n\n  : D",
    expected: "<dl><dt>T</dt><dd><p>D</p></dd></dl>"
  },
  {
    name: "a blank line before a marker in a bullet list item makes the definition loose",
    input: "- Term\n\n  : Def",
    expected: "<ul><li><dl><dt>Term</dt><dd><p>Def</p></dd></dl></li></ul>"
  },
  {
    name: "a blank line before a marker in an ordered list item makes the definition loose",
    input: "1. Term\n\n   : Def",
    expected: "<ol><li><dl><dt>Term</dt><dd><p>Def</p></dd></dl></li></ol>"
  },
  {
    name: "a blank line before a nested marker makes the nested definition loose",
    input: "T\n: D\n\n  : D2",
    expected:
      "<dl><dt>T</dt><dd><dl><dt>D</dt><dd><p>D2</p></dd></dl></dd></dl>"
  },
  {
    name: "a blank line before a nested marker after a nested term makes it loose",
    input: "T\n: A\n\n  B\n\n  : C",
    expected:
      "<dl><dt>T</dt><dd><p>A</p><dl><dt>B</dt><dd><p>C</p></dd></dl></dd></dl>"
  },
  {
    name: "a blank line before a later term's marker in a blockquote makes it loose",
    input: "> T1\n> : D1\n>\n> T2\n>\n> : D2",
    expected:
      "<blockquote><dl><dt>T1</dt><dd>D1</dd><dt>T2</dt><dd><p>D2</p></dd></dl></blockquote>"
  },

  // An empty definition is not a blank line: the definition after it stays tight unless a real blank line separates the two markers.
  {
    name: "the definition after a bare marker stays tight",
    input: "T\n:\n: D",
    expected: "<dl><dt>T</dt><dd></dd><dd>D</dd></dl>"
  },
  {
    name: "the definition after a marker followed only by spaces stays tight",
    input: "T\n:   \n: D",
    expected: "<dl><dt>T</dt><dd></dd><dd>D</dd></dl>"
  },
  {
    name: "a blank line before a later definition still makes it loose",
    input: "T\n: A\n\n: D",
    expected: "<dl><dt>T</dt><dd>A</dd><dd><p>D</p></dd></dl>"
  },

  // A block that starts on a continuation line of a definition measures its own content column from the definition's content column, not from the start of the line: the definition's indent is not the block's.
  {
    name: "a marker on a continuation line of a nested definition nests one level deeper",
    input: "a\n: b\n  : c\n    : d",
    expected:
      "<dl><dt>a</dt><dd><dl><dt>b</dt><dd><dl><dt>c</dt><dd>d</dd></dl></dd></dl></dd></dl>"
  },
  {
    name: "a bullet item on a continuation line keeps its second paragraph",
    input: "T\n: D\n\n  - a\n\n    b",
    expected:
      "<dl><dt>T</dt><dd><p>D</p><ul><li><p>a</p><p>b</p></li></ul></dd></dl>"
  },
  {
    name: "an ordered item on a continuation line keeps its second paragraph",
    input: "T\n: D\n\n  1. a\n\n     b",
    expected:
      "<dl><dt>T</dt><dd><p>D</p><ol><li><p>a</p><p>b</p></li></ol></dd></dl>"
  },
  {
    name: "a list item on a continuation line keeps its lazy and sibling lines",
    input: "T\n: D\n  - a\n    b\n  - c",
    expected: "<dl><dt>T</dt><dd>D\n<ul><li>a\nb</li><li>c</li></ul></dd></dl>"
  },
  {
    name: "a definition inside a list item still ends at a line indented only to the item",
    input: "- T\n  : D\n\n    more\n\n  after",
    expected:
      "<ul><li><dl><dt>T</dt><dd><p>D</p><p>more</p></dd></dl><p>after</p></li></ul>"
  },

  // Only a blank line between a definition's own blocks makes it loose, as for a list item. A blank line inside one of those blocks belongs to that block.
  {
    name: "a blank line between the items of a nested list leaves the definition tight",
    input: "Term\n: para\n  - a\n\n  - b",
    expected:
      "<dl><dt>Term</dt><dd>para\n<ul><li><p>a</p></li><li><p>b</p></li></ul></dd></dl>"
  },
  {
    name: "a blank line inside a nested list item leaves the definition tight",
    input: "T\n: para\n  - a\n\n    b",
    expected:
      "<dl><dt>T</dt><dd>para\n<ul><li><p>a</p><p>b</p></li></ul></dd></dl>"
  },
  {
    name: "a blank line inside a nested list item in a blockquote leaves the definition tight",
    input: "> T\n> : D\n>   - a\n>\n>     b",
    expected:
      "<blockquote><dl><dt>T</dt><dd>D\n<ul><li><p>a</p><p>b</p></li></ul></dd></dl></blockquote>"
  },
  {
    name: "a blank line inside a nested blockquote leaves the definition tight",
    input: "T\n: para\n  > a\n  >\n  > b",
    expected:
      "<dl><dt>T</dt><dd>para\n<blockquote><p>a</p><p>b</p></blockquote></dd></dl>"
  },
  {
    name: "a blank line between two paragraphs of a definition makes it loose",
    input: "T\n: para\n\n  more",
    expected: "<dl><dt>T</dt><dd><p>para</p><p>more</p></dd></dl>"
  },
  {
    name: "a blank line between a paragraph and indented code makes the definition loose",
    input: "T\n: a\n\n      code\n: D2",
    expected:
      "<dl><dt>T</dt><dd><p>a</p><pre><code>code\n</code></pre></dd><dd>D2</dd></dl>"
  },

  // A marker under a definition's own content column, in a list item nested in it, has no term there and no definition list to join: it is the item's paragraph going on, as any other text at that column would be. markdown-it measured the marker against the list item and ended its paragraph. A marker left of the definition's content column is the term's next definition.
  {
    name: "a marker at the definition's content column continues a nested list item's paragraph",
    input: "T\n: - a\n  : x",
    expected: "<dl><dt>T</dt><dd><ul><li>a\n: x</li></ul></dd></dl>"
  },
  {
    name: "a marker between the definition's content column and a nested item's continues the item's paragraph",
    input: "T\n: 1. a\n   : x",
    expected: "<dl><dt>T</dt><dd><ol><li>a\n: x</li></ol></dd></dl>"
  },
  {
    name: "a marker left of the definition's content column, after a nested list item, is the next definition",
    input: "T\n:   - a\n  : x",
    expected: "<dl><dt>T</dt><dd><ul><li>a</li></ul></dd><dd>x</dd></dl>"
  },
  {
    name: "a marker at the first column after a nested list item is the next definition",
    input: "T\n: - a\n: b",
    expected: "<dl><dt>T</dt><dd><ul><li>a</li></ul></dd><dd>b</dd></dl>"
  },

  // A table is not a term. remark's syntax took a table's finished head (its header and delimiter rows) for one, which closed the table for a definition list that was then declined, so a row starting with a marker fell out of the table as a paragraph. A line with a pipe that no delimiter row follows is not a table, and still is a term.
  {
    name: "a row that starts with a marker, right after a table's delimiter row, is a table row",
    input: "| a |\n| - |\n: D2",
    gfm: true,
    expected:
      "<table><thead><tr><th>a</th></tr></thead><tbody><tr><td>: D2</td></tr></tbody></table>"
  },
  {
    name: "a row that starts with a marker is a table row in a blockquote too",
    input: "> | a |\n> | - |\n> : D2",
    gfm: true,
    expected:
      "<blockquote><table><thead><tr><th>a</th></tr></thead><tbody><tr><td>: D2</td></tr></tbody></table></blockquote>"
  },
  {
    name: "a marker after a table's body row is a table row",
    input: "| a |\n| - |\n| b |\n: D2",
    gfm: true,
    expected:
      "<table><thead><tr><th>a</th></tr></thead><tbody><tr><td>b</td></tr><tr><td>: D2</td></tr></tbody></table>"
  },
  {
    name: "a line with pipes that is not a table is a term",
    input: "| a |\n: D",
    gfm: true,
    expected: "<dl><dt>| a |</dt><dd>D</dd></dl>"
  }
];
