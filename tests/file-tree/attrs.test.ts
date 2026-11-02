import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { fileTree } from "../../packages/mdit-file-tree/src";
import { rehypeFileTree } from "../../packages/remd-file-tree/src";
import { satteriFileTree } from "../../packages/sat-file-tree/src";
import { normalizeHtml } from "../utils/index.js";

// attrs before the trees in each engine, as the presets order them.
const md = new MarkdownIt().use(attrs).use(fileTree);
const remark = unified()
  .use(remarkParse)
  .use(remarkAttrs)
  .use(remarkRehype)
  .use(rehypeFileTree)
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
        hastPlugins: [satteriFileTree()]
      }).html
  }
].map(({ engine, render }) => ({
  engine,
  render: (input: string) => normalizeHtml(render(input))
}));

const fence = (attributes: string) =>
  "```filetree " + attributes + "\nsrc/\n  index.ts\n```";
const treeTag = (html: string) =>
  /<ul class="markdown-file-tree[^>]*>/.exec(html)?.[0] ?? ``;

describe("file-tree + attrs: a class joins the tree's, and an id is set", () => {
  it.each(engines)("$engine", ({ render }) => {
    const tag = treeTag(render(fence(`{.wide #project}`)));
    expect(tag).toContain(`class="markdown-file-tree wide"`);
    expect(tag).toContain(`id="project"`);
  });
});

// The client script names a tree "Files" unless it has a name of its own; the fence is where an author gives one.
describe("file-tree + attrs: an aria-label names the tree", () => {
  it.each(engines)("$engine", ({ render }) => {
    expect(treeTag(render(fence(`{aria-label="Project files"}`)))).toContain(
      `aria-label="Project files"`
    );
  });
});

describe("file-tree + attrs: values are escaped", () => {
  it.each(engines)("$engine", ({ render }) => {
    expect(treeTag(render(fence(`{data-note="a&b"}`)))).toContain(
      `data-note="a&amp;b"`
    );
  });
});

describe("file-tree + attrs: every engine writes the same tree", () => {
  const input = fence(`{.wide #project data-kind=app}`);
  const [first] = engines.map(({ render }) => render(input));
  it.each(engines)("$engine", ({ render }) => {
    expect(render(input)).toBe(first);
  });
});

describe("file-tree + attrs: another language keeps its attributes on the code", () => {
  it.each(engines)("$engine", ({ render }) => {
    expect(render("```js {.highlight}\nx\n```")).toBe(
      `<pre><code class="highlight language-js">x\n</code></pre>`
    );
  });
});
