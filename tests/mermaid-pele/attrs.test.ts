import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { mermaidPele } from "../../packages/mdit-mermaid-pele/src";
import { rehypeMermaidPele } from "../../packages/remd-mermaid-pele/src";
import { satteriMermaidPele } from "../../packages/sat-mermaid-pele/src";
import { normalizeHtml } from "../utils/index.js";
import { options } from "./options.js";

// attrs runs before the diagrams in each engine, as the presets order them; markdown-it-attrs is installed after, so its fence wrapper sees the diagram's output too.
const md = new MarkdownIt().use(mermaidPele, options).use(attrs);
const remark = unified()
  .use(remarkParse)
  .use(remarkAttrs)
  .use(remarkRehype)
  .use(rehypeMermaidPele, options)
  .use(rehypeStringify, { allowDangerousHtml: true });

const engines = [
  { engine: `markdown-it`, render: (input: string) => md.render(input) },
  {
    engine: `remark`,
    render: (input: string) => String(remark.processSync(input))
  },
  {
    engine: `sätteri`,
    render: (input: string) =>
      markdownToHtml(input, {
        features: { attributes: true, smartPunctuation: false },
        hastPlugins: [satteriMermaidPele(options)]
      }).html
  }
].map(({ engine, render }) => ({
  engine,
  render: (input: string) => normalizeHtml(render(input))
}));

const fence = (attributes: string) =>
  "```mermaid " + attributes + "\nflowchart LR\n  A --> B\n```";
const svgTag = (html: string) => /<svg[^>]*>/.exec(html)?.[0] ?? ``;

describe("mermaid-pele + attrs: a class joins Pele's, and an id is set", () => {
  it.each(engines)("$engine", ({ render }) => {
    const tag = svgTag(render(fence(`{.wide #flow}`)));
    expect(tag).toContain(`class="pele pele-flowchart wide"`);
    expect(tag).toContain(`id="flow"`);
  });
});

describe("mermaid-pele + attrs: other attributes are added", () => {
  it.each(engines)("$engine", ({ render }) => {
    expect(svgTag(render(fence(`{data-chart=flow}`)))).toContain(
      `data-chart="flow"`
    );
  });
});

describe("mermaid-pele + attrs: a style follows Pele's, which holds the theme variables", () => {
  it.each(engines)("$engine", ({ render }) => {
    const tag = svgTag(render(fence(`{style="outline:1px solid"}`)));
    expect(tag).toMatch(
      / style="max-width:100%;height:auto;--_bg:[^"]*;outline:1px solid"/
    );
  });
});

describe("mermaid-pele + attrs: values are escaped", () => {
  it.each(engines)("$engine", ({ render }) => {
    expect(svgTag(render(fence(`{data-note="a&b"}`)))).toContain(
      `data-note="a&amp;b"`
    );
  });
});

describe("mermaid-pele + attrs: every engine writes the same <svg>", () => {
  const input = fence(`{.wide #flow data-chart=flow}`);
  const [first] = engines.map(({ render }) => render(input));
  it.each(engines)("$engine", ({ render }) => {
    expect(render(input)).toBe(first);
  });
});

describe("mermaid-pele + attrs: another language keeps its attributes on the code", () => {
  it.each(engines)("$engine", ({ render }) => {
    expect(render("```js {.highlight}\nx\n```")).toBe(
      `<pre><code class="highlight language-js">x\n</code></pre>`
    );
  });
});
