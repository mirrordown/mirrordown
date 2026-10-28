import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { steps } from "../../packages/mdit-steps/src";
import { githubAlerts } from "../../packages/mdit-github-alerts/src";
import { remarkSteps, stepsHastHandlers } from "../../packages/remd-steps/src";
import {
  remarkGithubAlerts,
  githubAlertsHastHandlers
} from "../../packages/remd-github-alerts/src";
import { satteriSteps } from "../../packages/sat-steps/src";
import { satteriGithubAlerts } from "../../packages/sat-github-alerts/src";
import { normalizeHtml } from "../utils/index.js";

// Alerts run before steps in every engine, as the presets order them.
const md = new MarkdownIt().use(githubAlerts).use(steps);
const remark = unified()
  .use(remarkParse)
  .use(remarkGithubAlerts)
  .use(remarkSteps)
  .use(remarkRehype, {
    handlers: { ...githubAlertsHastHandlers, ...stepsHastHandlers } as never
  })
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
        mdastPlugins: [satteriGithubAlerts(), satteriSteps()]
      }).html
  }
].map(({ engine, render }) => ({
  engine,
  render: (input: string) => normalizeHtml(render(input))
}));

// A quote after a blank line continues the last step's body, but an alert is a block of its own: it ends the steps, whether or not the alerts plugin reads it.
describe("steps + github-alerts: an alert after a blank line ends the steps", () => {
  const input = "@1. Step\n>  Do this.\n\n> [!NOTE]\n> A note.";
  const [first] = engines.map(({ render }) => render(input));
  it.each(engines)("$engine", ({ render }) => {
    const html = render(input);
    expect(html).toBe(first);
    expect(html).toMatch(
      /^<ol class="markdown-steps">.*<\/ol><div class="markdown-alert" data-alert="note">/s
    );
  });
});

describe("steps + github-alerts: a plain quote after a blank line still continues the body", () => {
  const input = "@1. Step\n>  Do this.\n\n> And this.";
  const [first] = engines.map(({ render }) => render(input));
  it.each(engines)("$engine", ({ render }) => {
    const html = render(input);
    expect(html).toBe(first);
    expect(html).toContain(
      `<div class="markdown-steps-body"><p>Do this.</p><p>And this.</p></div>`
    );
  });
});
