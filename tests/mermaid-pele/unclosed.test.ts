import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { mermaidPele } from "../../packages/mdit-mermaid-pele/src";
import { rehypeMermaidPele } from "../../packages/remd-mermaid-pele/src";
import { satteriMermaidPele } from "../../packages/sat-mermaid-pele/src";
import { normalizeHtml } from "../utils/index.js";
import { options } from "./options.js";

// A diagram's id prefix is a hash of its source, and every id inside the SVG hangs off it. The engines only emit the same ids if they hash the same string, and they read the source from different places: markdown-it from the fence token, the others from the `<code>` text. A fence the input ends without closing is where those differed.

const md = new MarkdownIt().use(mermaidPele, options);
const remark = unified()
  .use(remarkParse)
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
        features: { smartPunctuation: false },
        hastPlugins: [satteriMermaidPele(options)]
      }).html
  }
];

// `accTitle` makes the renderer write an id, which is where the prefix shows.
const diagram = "```mermaid\nflowchart LR\n  accTitle: T\n  A --> B";
const titleId = (html: string) => /<title id="([^"]*)"/.exec(html)?.[1];

describe("mermaid-pele: an unclosed fence at the end of the input", () => {
  const closed = titleId(md.render(`${diagram}\n\`\`\`\n`));

  it("has an id to compare", () => {
    expect(closed).toMatch(/-title$/);
  });

  it.each(engines)(
    "$engine gives it the ids of the same diagram closed",
    ({ render }) => {
      expect(titleId(render(diagram))).toBe(closed);
      expect(titleId(render(`${diagram}\n`))).toBe(closed);
    }
  );

  it("renders the same markup in every engine", () => {
    const [first, ...rest] = engines.map(({ render }) =>
      normalizeHtml(render(diagram))
    );
    for (const html of rest) expect(html).toBe(first);
  });
});
