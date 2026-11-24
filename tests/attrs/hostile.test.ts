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

// The three engines, with attribute blocks read or not. Sätteri reads blocks itself, through its `attributes` feature.
const pipelines = (on: boolean): ((input: string) => string)[] => {
  const md = new MarkdownIt();
  if (on) md.use(attrs);
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(on ? [remarkAttrs] : [])
    .use(remarkRehype)
    .use(rehypeStringify);
  return [
    (input) => md.render(input),
    (input) => String(processor.processSync(input)),
    (input) =>
      markdownToHtml(input, {
        features: { gfm: true, attributes: on, smartPunctuation: false }
      }).html
  ];
};
const withPlugin = pipelines(true);

// hast-util-to-html looks each attribute's name up in property-information's table of HTML names after lower-casing it, and that table is a plain object: `constructor` and `__proto__` are found there as members every object inherits, resolve to nothing, and the serializer throws for the whole page. So remd-attrs leaves such a name out, wherever the block is, and applies the rest of the block; markdown-it and Sätteri print it. The fault is a dependency's, so this is an engine difference, kept out of the shared fixtures.
describe("attrs: a name every object inherits", () => {
  const [mdit, remd, sat] = withPlugin.map(
    (render) => (input: string) => normalizeHtml(render(input))
  );

  it.each([
    [
      "ending a paragraph, with the rest of the block",
      "text {.a constructor=own #b}",
      '<p class="a" constructor="own" id="b">text</p>',
      '<p class="a" id="b">text</p>'
    ],
    [
      "alone in a block, which is still read",
      "text {constructor=own}",
      '<p constructor="own">text</p>',
      "<p>text</p>"
    ],
    [
      "on a line of its own",
      "text\n{constructor=own}",
      '<p constructor="own">text</p>',
      "<p>text</p>"
    ],
    [
      "ending a heading",
      "# Heading {constructor=own}",
      '<h1 constructor="own">Heading</h1>',
      "<h1>Heading</h1>"
    ],
    [
      "ending a list item",
      "- item {constructor=own}",
      '<ul><li constructor="own">item</li></ul>',
      "<ul><li>item</li></ul>"
    ],
    [
      "after a list",
      "- a\n- b\n\n{constructor=own}",
      '<ul constructor="own"><li>a</li><li>b</li></ul>',
      "<ul><li>a</li><li>b</li></ul>"
    ],
    [
      "in a fence's info string",
      "```js {constructor=own}\ncode\n```",
      '<pre><code class="language-js" constructor="own">code\n</code></pre>',
      '<pre><code class="language-js">code\n</code></pre>'
    ],
    [
      "ending a table cell",
      "| A |\n|---|\n| a {constructor=own} |",
      '<table><thead><tr><th>A</th></tr></thead><tbody><tr><td constructor="own">a</td></tr></tbody></table>',
      "<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>a</td></tr></tbody></table>"
    ],
    [
      "after a table",
      "| A |\n|---|\n| a |\n\n{constructor=own}",
      '<table constructor="own"><thead><tr><th>A</th></tr></thead><tbody><tr><td>a</td></tr></tbody></table>',
      "<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>a</td></tr></tbody></table>"
    ],
    [
      "after a rule",
      "---\n\n{constructor=own}",
      '<hr constructor="own">',
      "<hr>"
    ],
    [
      "after emphasis",
      "*em*{constructor=x}",
      '<p><em constructor="x">em</em></p>',
      "<p><em>em</em></p>"
    ],
    [
      "after an image",
      "![a](pic.png){constructor=own}",
      '<p><img src="pic.png" alt="a" constructor="own"></p>',
      '<p><img src="pic.png" alt="a"></p>'
    ],
    [
      "written in capitals, which the lookup lower-cases",
      "text {Constructor=x}",
      '<p Constructor="x">text</p>',
      "<p>text</p>"
    ],
    [
      "written in capitals throughout",
      "text {CONSTRUCTOR=x}",
      '<p CONSTRUCTOR="x">text</p>',
      "<p>text</p>"
    ],
    // `text {__proto__=p}` never reaches the plugin: markdown-it and remark have read the underscores as strong emphasis by then (Sätteri reads the block while it parses). An info string is not parsed for emphasis, so a fence is the way in.
    [
      "`__proto__`, in a fence's info string",
      "```js {__proto__=p}\ncode\n```",
      '<pre><code class="language-js" __proto__="p">code\n</code></pre>',
      '<pre><code class="language-js">code\n</code></pre>'
    ]
  ])("%s", (_where, input, printed, left) => {
    expect(mdit(input)).toBe(printed);
    expect(sat(input)).toBe(printed);
    expect(remd(input)).toBe(left);
  });

  // A name with a capital lower-cases to something no object has, and the lookup finds nothing: these are printed everywhere.
  it("prints names of inherited members that have a capital", () => {
    const input = "text {toString=a valueOf=b hasOwnProperty=c}";
    const printed = '<p toString="a" valueOf="b" hasOwnProperty="c">text</p>';
    expect(mdit(input)).toBe(printed);
    expect(remd(input)).toBe(printed);
    expect(sat(input)).toBe(printed);
  });

  // `allowed` lets a name through to the plugin; it can't make the serializer print it.
  it("leaves the name out in remark when `allowed` names it", () => {
    const allowed = ["class", "constructor"];
    const input = "text {.a constructor=own}";
    expect(
      normalizeHtml(new MarkdownIt().use(attrs, { allowed }).render(input))
    ).toBe('<p class="a" constructor="own">text</p>');
    expect(
      normalizeHtml(
        String(
          unified()
            .use(remarkParse)
            .use(remarkAttrs, { allowed })
            .use(remarkRehype)
            .use(rehypeStringify)
            .processSync(input)
        )
      )
    ).toBe('<p class="a">text</p>');
  });
});
