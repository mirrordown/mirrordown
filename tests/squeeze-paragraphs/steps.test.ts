import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { squeezeParagraphs } from "../../packages/mdit-squeeze-paragraphs/src";
import { steps } from "../../packages/mdit-steps/src";
import { rehypeSqueezeParagraphs } from "../../packages/remd-squeeze-paragraphs/src";
import { remarkSteps, stepsHastHandlers } from "../../packages/remd-steps/src";
import { satteriSqueezeParagraphs } from "../../packages/sat-squeeze-paragraphs/src";
import { satteriSteps } from "../../packages/sat-steps/src";
import { normalizeHtml } from "../utils/index.js";

const engines = [
  {
    engine: `markdown-it`,
    render: (input: string) =>
      new MarkdownIt().use(steps).use(squeezeParagraphs).render(input)
  },
  {
    engine: `remark`,
    render: (input: string) =>
      String(
        unified()
          .use(remarkParse)
          .use(remarkSteps)
          .use(remarkRehype, { handlers: stepsHastHandlers as never })
          .use(rehypeSqueezeParagraphs)
          .use(rehypeStringify)
          .processSync(input)
      )
  },
  {
    engine: `sätteri`,
    render: (input: string) =>
      markdownToHtml(input, {
        features: { smartPunctuation: false },
        mdastPlugins: [satteriSteps()],
        hastPlugins: [satteriSqueezeParagraphs()]
      }).html
  }
].map(({ engine, render }) => ({
  engine,
  render: (input: string) => normalizeHtml(render(input))
}));

// A step's title is a `<p>` that is not a Markdown paragraph. The rule is "an empty `<p>`", whichever plugin wrote it, so a title that renders nothing goes in every engine: markdown-it has to recognise it by its tag, not by the `paragraph_open` token type.
describe("squeeze-paragraphs + steps: an empty step title is removed like any other empty <p>", () => {
  it.each(engines)("$engine", ({ render }) => {
    expect(render("@1. &#32;\n> Body")).toBe(
      '<ol class="markdown-steps"><li class="markdown-steps-item" data-step="1"><div class="markdown-steps-body"><p>Body</p></div></li></ol>'
    );
  });
});

describe("squeeze-paragraphs + steps: a step title with text is kept", () => {
  it.each(engines)("$engine", ({ render }) => {
    expect(render("@1. Title\n> Body")).toBe(
      '<ol class="markdown-steps"><li class="markdown-steps-item" data-step="1"><p class="markdown-steps-title">Title</p><div class="markdown-steps-body"><p>Body</p></div></li></ol>'
    );
  });
});
