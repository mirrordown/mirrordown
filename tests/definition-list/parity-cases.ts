// Inputs just outside the shared fixture, written as strings because several depend on exact indentation, tabs or trailing spaces. Every engine test in this folder runs them, and `expected` is what Sätteri's built-in `definitionList` emits: it cannot be changed, so it is the reference the markdown-it and remark plugins are held to.

export interface ParityCase {
  name: string;
  input: string;
  expected: string;
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
  }
];
