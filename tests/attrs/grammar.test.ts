import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { normalizeHtml } from "../utils/index.js";

// Sätteri reads attribute blocks itself (its built-in `attributes` feature), and that reader can't be changed from here. So it is the reference for what a block is: these cases pin mdit-attrs and remd-attrs to it, on input the fixtures don't reach.
const md = new MarkdownIt().use(attrs);
const engines: [string, (src: string) => string][] = [
  ["markdown-it", (src) => normalizeHtml(md.render(src))],
  [
    "remark",
    (src) =>
      normalizeHtml(
        String(
          unified()
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkAttrs)
            .use(remarkRehype)
            .use(rehypeStringify)
            .processSync(src)
        )
      )
  ],
  [
    "sätteri",
    (src) =>
      normalizeHtml(
        markdownToHtml(src, {
          features: { gfm: true, attributes: true, smartPunctuation: false }
        }).html
      )
  ]
];

type Case = [why: string, input: string, expected: string];

// An element can't carry the same attribute twice: the HTML is invalid and browsers keep the first one, so an engine that appended would show a different value than one that replaced.
const repeated: Case[] = [
  ["a repeated id keeps the last", "text {#a #b}", '<p id="b">text</p>'],
  [
    "a repeated key keeps the last",
    "text {data-x=1 data-x=2}",
    '<p data-x="2">text</p>'
  ],
  [
    "a link's own href is replaced, not doubled",
    "[x](/a){href=/b}",
    '<p><a href="/b">x</a></p>'
  ],
  [
    "an image's own src is replaced in place",
    "![a](x.png){src=y.png}",
    '<p><img src="y.png" alt="a"></p>'
  ],
  ["classes still add up", "text {.a class=b .c}", '<p class="a b c">text</p>']
];

// What counts as a block. Each of these read differently on markdown-it and remark than on Sätteri before they shared its grammar.
const blocks: Case[] = [
  [
    "a value can be single-quoted",
    "text {title='a b' data-x=\"c d\"}",
    '<p title="a b" data-x="c d">text</p>'
  ],
  [
    "a tab separates words like a space",
    "text {.a\t.b}",
    '<p class="a b">text</p>'
  ],
  [
    "a quote that never closes is not a block",
    'text {title="unterminated}',
    '<p>text {title="unterminated}</p>'
  ],
  [
    "a quote only opens right after the =",
    'text {title="a"b}',
    '<p title="&quot;a&quot;b">text</p>'
  ],
  [
    "a closing delimiter inside a quoted value belongs to the value",
    'text {title="{x}"}',
    '<p title="{x}">text</p>'
  ],
  [
    "the same after an inline element",
    '*a*{title="a } b"}c',
    '<p><em title="a } b">a</em>c</p>'
  ],
  [
    "a delimiter outside a quoted value ends the block early",
    "text {a=b}c}",
    "<p>text {a=b}c}</p>"
  ],
  ["a block can't span lines", "text {.a\n.b}", "<p>text {.a\n.b}</p>"],
  [
    "a lone character is ignored next to an attribute",
    'text {title="a" b .}',
    '<p title="a">text</p>'
  ],
  [
    "a word of two characters or more is a key with no value",
    "Hello {name}",
    '<p name="">Hello</p>'
  ],
  [
    "a key that isn't a name makes the block text",
    'text {a"b=c}',
    '<p>text {a"b=c}</p>'
  ],
  ["a key can't hold a slash", "text {a/b=c}", "<p>text {a/b=c}</p>"],
  ["a key can't open with a digit", "text {1=2}", "<p>text {1=2}</p>"],
  ["a value needs a key", "text {=x}", "<p>text {=x}</p>"],
  [
    "a second dot is part of the class name",
    "text {..mod}",
    '<p class=".mod">text</p>'
  ],
  ["class is one name in any case", "text {CLASS=a}", '<p class="a">text</p>'],
  ["id is one name in any case", "text {ID=a}", '<p id="a">text</p>']
];

// Prose must survive: text is only removed when it gave the element an attribute.
const prose: Case[] = [
  ["empty braces", "The default is {}", "<p>The default is {}</p>"],
  ["braces around a space", "text { }", "<p>text { }</p>"],
  ["a lone class marker", "text {.}", "<p>text {.}</p>"],
  ["a lone id marker", "text {#}", "<p>text {#}</p>"],
  ["a lone letter", "text {x}", "<p>text {x}</p>"],
  ["a lone equals sign", "text {=}", "<p>text {=}</p>"],
  ["a lone slash", "text {/}", "<p>text {/}</p>"],
  ["a list in braces", "Use {a, b}", "<p>Use {a, b}</p>"],
  ["set notation", "f(x) = {x | x > 0}", "<p>f(x) = {x | x > 0}</p>"],
  ["empty braces after an inline element", "*a*{ }b", "<p><em>a</em>{ }b</p>"],
  ["a letter after an inline element", "*a*{b}c", "<p><em>a</em>{b}c</p>"],
  ["on a line of its own", "text\n{x}", "<p>text\n{x}</p>"],
  ["ending a heading", "# H {x}", "<h1>H {x}</h1>"],
  ["ending a list item", "- item {}", "<ul><li>item {}</li></ul>"],
  [
    "ending a table cell",
    "| A |\n|---|\n| a {x} |",
    "<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>a {x}</td></tr></tbody></table>"
  ],
  [
    "after a list",
    "- a\n- b\n\n{x}",
    "<ul><li>a</li><li>b</li></ul><p>{x}</p>"
  ],
  ["after a rule", "---\n\n{x}", "<hr><p>{x}</p>"],
  [
    "as a fence's info string",
    "``` {x}\ncode\n```",
    '<pre><code class="language-{x}">code\n</code></pre>'
  ]
];

// An author must be able to write a literal `{.a}`. markdown-it and Sätteri see the escape; remark has resolved it by the time a plugin runs, so remd-attrs checks the source.
const escaped: Case[] = [
  ["an escaped opening brace", "text \\{.a}", "<p>text {.a}</p>"],
  ["an escaped closing brace", "text {.a\\}", "<p>text {.a}</p>"],
  [
    "an opening brace as a character reference",
    "text &#123;.a}",
    "<p>text {.a}</p>"
  ],
  [
    "a closing brace as a character reference",
    "text {.a&#125;",
    "<p>text {.a}</p>"
  ],
  ["after an inline element", "*em*\\{.a}", "<p><em>em</em>{.a}</p>"],
  ["on a line of its own", "text\n\\{.a}", "<p>text\n{.a}</p>"],
  ["ending a list item", "- item \\{.x}", "<ul><li>item {.x}</li></ul>"],
  [
    "ending a table cell",
    "| A |\n|---|\n| a \\{.x} |",
    "<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>a {.x}</td></tr></tbody></table>"
  ],
  [
    "after a list",
    "- a\n- b\n\n\\{.x}",
    "<ul><li>a</li><li>b</li></ul><p>{.x}</p>"
  ],
  [
    "an escape inside the block",
    'text {title="a\\"b"}',
    '<p>text {title="a"b"}</p>'
  ],
  [
    "a character reference inside the block",
    'text {title="a&amp;b"}',
    '<p>text {title="a&amp;b"}</p>'
  ],
  [
    "a character reference before the block doesn't stop it",
    "a &amp; *b*{.c} d {.e}",
    '<p class="e">a &amp; <em class="c">b</em> d</p>'
  ]
];

describe.each(engines)("attrs/grammar (%s)", (_engine, render) => {
  it.each(repeated)("one attribute per name: %s", (_why, input, expected) => {
    expect(render(input)).toBe(expected);
  });

  it.each(escaped)(
    "an escaped delimiter is text: %s",
    (_why, input, expected) => {
      expect(render(input)).toBe(expected);
    }
  );

  it.each(blocks)("one grammar: %s", (_why, input, expected) => {
    expect(render(input)).toBe(expected);
  });

  it.each(prose)(
    "braces that set nothing stay text: %s",
    (_why, input, expected) => {
      expect(render(input)).toBe(expected);
    }
  );
});

// Where Sätteri can't follow. Its reader works on one run of plain text, so a character that could start other inline syntax ends the block, and it reads a heading's block before the heading's closing sequence. The forms are documented ones (`.class`, `key=value`), so mdit-attrs and remd-attrs keep them; the guide lists the difference. A change on Sätteri's side shows up here.
const limits: [why: string, input: string, ours: string, satteri: string][] = [
  [
    "a square bracket in a class",
    "text {.w-[10px]}",
    '<p class="w-[10px]">text</p>',
    "<p>text {.w-[10px]}</p>"
  ],
  [
    "an angle bracket in a value",
    'text {title="a<b"}',
    '<p title="a<b">text</p>',
    '<p>text {title="a&lt;b"}</p>'
  ],
  [
    "a heading with a closing sequence",
    "# H {.a} #",
    '<h1 class="a">H</h1>',
    "<h1>H {.a}</h1>"
  ],
  [
    "an escaped brace ending a heading, which Sätteri reads before escapes",
    "# H \\{.x}",
    "<h1>H {.x}</h1>",
    '<h1 class="x">H \\</h1>'
  ],
  [
    "a backslash escape earlier in the text",
    "\\* text {.a}",
    '<p class="a">* text</p>',
    "<p>* text {.a}</p>"
  ],
  [
    "an escaped backslash right before the block",
    "text \\\\{.a}",
    '<p class="a">text \\</p>',
    "<p>text \\{.a}</p>"
  ]
];

describe("attrs/grammar: Sätteri's limits", () => {
  it.each(limits)("%s", (_why, input, ours, satteri) => {
    const [[, mdit], [, remd], [, sat]] = engines;
    expect(mdit(input)).toBe(ours);
    expect(remd(input)).toBe(ours);
    expect(sat(input)).toBe(satteri);
  });
});

// GFM constructs markdown-it doesn't have without further plugins, so remark is pinned to Sätteri alone.
describe("attrs/grammar: remark and Sätteri", () => {
  const [, [, remd], [, sat]] = engines;
  const both = (input: string): string => {
    const html = remd(input);
    expect(html).toBe(sat(input));
    return html;
  };

  // mdast-util-to-hast gives task lists and their items a class of its own; a second `class` attribute next to it is invalid, and browsers drop the author's.
  it("a task item's classes share one attribute with the generated one", () => {
    expect(both("- [ ] task {.a}")).toBe(
      '<ul class="contains-task-list"><li class="a task-list-item"><input type="checkbox" disabled> task</li></ul>'
    );
  });

  it("a task list's classes share one attribute with the generated one", () => {
    expect(both("- [x] task\n{.a}")).toContain(
      '<ul class="a contains-task-list"><li class="task-list-item">'
    );
  });

  // The line is indented to the item's content, so it is written in the item, wherever the item's first paragraph starts (after `[x] ` in a task item).
  it("a block on its own line in a task item goes on the item, not its list", () => {
    expect(both("- [x] task\n  {.a}")).toContain(
      '<ul class="contains-task-list"><li class="a task-list-item">'
    );
    expect(both("- [x] task\n\n  para\n  {.a}")).toContain(
      '<p class="a">para</p>'
    );
  });

  // A footnote reference can't carry the block (its `<sup>` isn't the author's element), so the block is the paragraph's.
  it("a block after a footnote reference falls through to the paragraph", () => {
    expect(both("[^1]{.a}\n\n[^1]: note")).toContain('<p class="a"><sup><a ');
    expect(both("[^1]{.a} x\n\n[^1]: note")).toContain("</sup>{.a} x</p>");
  });

  // Raw HTML is dropped by remark-rehype unless allowed, and ignores hProperties either way: a block given to it would vanish with nothing applied.
  it("a block after raw HTML falls through to the paragraph instead of being lost", () => {
    expect(remd("<span>x</span>{.a}")).toBe('<p class="a">x</p>');
    expect(sat("<span>x</span>{.a}")).toBe('<p class="a"><span>x</span></p>');
    expect(remd("a<br>{.a} b")).toBe("<p>a{.a} b</p>");
  });
});

// remark splits a fence's info string at its first space, so a block isn't always in one field.
describe.each(engines)("attrs/grammar: fences (%s)", (_engine, render) => {
  it.each<Case>([
    [
      "several attributes and no language",
      "``` {.a .b}\ncode\n```",
      '<pre><code class="a b">code\n</code></pre>'
    ],
    [
      "a quoted value and no language",
      '``` {.a title="x y"}\ncode\n```',
      '<pre><code class="a" title="x y">code\n</code></pre>'
    ],
    [
      "a block right after the language",
      "```js{.a .b}\ncode\n```",
      '<pre><code class="a b language-js">code\n</code></pre>'
    ],
    [
      "words between the language and the block",
      "```js x {.a .b}\ncode\n```",
      '<pre><code class="a b language-js">code\n</code></pre>'
    ]
  ])("%s", (_why, input, expected) => {
    expect(render(input)).toBe(expected);
  });
});

// `colspan` and `rowspan` are attributes like any other: no engine drops the cells a span would cover, so a row keeps the cells it was written with. (mdit-attrs once carried markdown-it-attrs' span calculator, which never ran; remark and Sätteri have nothing like it.)
describe.each(engines)("attrs/grammar: tables (%s)", (_engine, render) => {
  it("a spanning cell keeps its neighbours", () => {
    expect(
      render("| A | B |\n|---|---|\n| a {colspan=2} | b {rowspan=2} |")
    ).toBe(
      '<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td colspan="2">a</td><td rowspan="2">b</td></tr></tbody></table>'
    );
  });
});
