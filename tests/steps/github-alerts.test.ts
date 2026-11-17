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

// Alerts are listed before steps here, in every engine. The presets list them the other way round, alerts after steps and tabs; this file covers the order a hand-written setup can still have.
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

// Only a marker written with the body's own `>` is an alert beside the steps. One level deeper it is a quote in the body, which the alerts plugin turns into an alert there: remark and Sätteri used to end the steps at any quote whose first line holds a marker, however deep.
describe("steps + github-alerts: an alert nested in a body stays in the body", () => {
  describe.each([
    ["directly under the header", "@1. Step\n> > [!NOTE]\n> > A note."],
    ["after a blank line", "@1. Step\n> Do this.\n\n> > [!NOTE]\n> > A note."]
  ])("%s", (_, input) => {
    const [first] = engines.map(({ render }) => render(input));
    it.each(engines)("$engine", ({ render }) => {
      const html = render(input);
      expect(html).toBe(first);
      expect(html).toMatch(
        /<div class="markdown-steps-body">(<p>Do this\.<\/p>)?<div class="markdown-alert" data-alert="note">.*<\/div><\/li><\/ol>$/s
      );
    });
  });
});

// Known difference of this order (alerts listed before steps), pinned so a change to it is noticed; the presets list alerts after steps, and the alerts guide says to. A marker directly under a header, with the body's own `>`, is the first line of the body in markdown-it, where the alerts plugin never sees a quote. In remark and Sätteri the alerts plugin, listed first here, has already made the quote an alert, without its marker, so steps can only leave it be: the steps end and the alert follows them. Writing the alert as a nested quote (`> > [!TIP]`) is the same in every engine.
describe("steps + github-alerts: a marker directly under a header, with the alerts plugin", () => {
  const input = "@1. Step\n> [!TIP]\n> A tip.";
  it("markdown-it reads the body's first line", () => {
    expect(engines[0]?.render(input)).toBe(
      `<ol class="markdown-steps"><li class="markdown-steps-item" data-step="1"><p class="markdown-steps-title">Step</p><div class="markdown-steps-body"><p>[!TIP]\nA tip.</p></div></li></ol>`
    );
  });
  it.each(engines.slice(1))(
    "$engine keeps the alert the plugin made",
    ({ render }) => {
      expect(render(input)).toMatch(
        /^<ol class="markdown-steps"><li class="markdown-steps-item" data-step="1"><p class="markdown-steps-title">Step<\/p><\/li><\/ol><div class="markdown-alert" data-alert="tip">/
      );
    }
  );
});
