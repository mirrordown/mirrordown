import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { steps } from "../../packages/mdit-steps/src";
import { tabs } from "../../packages/mdit-tabs/src";
import { mermaidPele } from "../../packages/mdit-mermaid-pele/src";
import { remarkSteps, stepsHastHandlers } from "../../packages/remd-steps/src";
import { remarkTabs, tabsHastHandlers } from "../../packages/remd-tabs/src";
import { rehypeMermaidPele } from "../../packages/remd-mermaid-pele/src";
import { satteriSteps } from "../../packages/sat-steps/src";
import { satteriTabs } from "../../packages/sat-tabs/src";
import { satteriMermaidPele } from "../../packages/sat-mermaid-pele/src";
import { normalizeHtml } from "../utils/index.js";
import { options } from "./options.js";

// A diagram in a tab panel or a step body renders as it does anywhere else: the containers keep the fence as a code block, and the diagram replaces it.
const md = new MarkdownIt().use(steps).use(tabs).use(mermaidPele, options);
const remark = unified()
  .use(remarkParse)
  .use(remarkSteps)
  .use(remarkTabs)
  .use(remarkRehype, {
    handlers: { ...stepsHastHandlers, ...tabsHastHandlers } as never
  })
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
        features: { gfm: false, frontmatter: false, smartPunctuation: false },
        mdastPlugins: [satteriSteps(), satteriTabs()],
        hastPlugins: [satteriMermaidPele(options)]
      }).html
  }
].map(({ engine, render }) => ({
  engine,
  render: (input: string) => normalizeHtml(render(input))
}));

const diagram = normalizeHtml(
  md.render("```mermaid\nflowchart LR\n  A --> B\n```")
);

describe("mermaid-pele + tabs: the same diagram in two panels", () => {
  const panel =
    "> ```mermaid\n> flowchart LR\n>   accTitle: Flow\n>   A --> B\n> ```";
  const input = `% One\n${panel}\n% Two\n${panel}`;
  const [first] = engines.map(({ render }) => render(input));
  it.each(engines)("$engine", ({ render }) => {
    const html = render(input);
    expect(html).toBe(first);
    expect(html).not.toContain(`language-mermaid`);
    // The second panel's diagram is a repeat, so its ids count it, and the page has no duplicate ids.
    const ids = [...html.matchAll(/<title id="([^"]+)"/g)].map(([, id]) => id);
    expect(ids).toHaveLength(2);
    expect(ids[1]).toBe(ids[0]?.replace(/-title$/, `-2-title`));
  });
});

describe("mermaid-pele + steps: a diagram in a step body", () => {
  const input =
    "@1. Draw it\n>  Like so:\n>\n>  ```mermaid\n>  flowchart LR\n>    A --> B\n>  ```\n@1. Done\n>  Next.";
  const [first] = engines.map(({ render }) => render(input));
  it.each(engines)("$engine", ({ render }) => {
    const html = render(input);
    expect(html).toBe(first);
    expect(html).toContain(diagram);
    expect(html).not.toContain(`language-mermaid`);
  });
});
