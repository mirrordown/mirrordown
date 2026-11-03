import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { prompt } from "../../packages/mdit-prompt/src";
import { rehypePrompt, remarkPrompt } from "../../packages/remd-prompt/src";
import {
  satteriPrompt,
  satteriPromptPreview
} from "../../packages/sat-prompt/src";
import { normalizeHtml } from "../utils/index.js";

// attrs and the prompts in each engine, in the presets' order.
const md = new MarkdownIt().use(attrs).use(prompt);
const remark = unified()
  .use(remarkParse)
  .use(remarkPrompt)
  .use(remarkAttrs)
  .use(remarkRehype)
  .use(rehypePrompt)
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
        mdastPlugins: [satteriPromptPreview()],
        hastPlugins: [satteriPrompt()]
      }).html
  }
].map(({ engine, render }) => ({
  engine,
  render: (input: string) => normalizeHtml(render(input))
}));

const fence = (meta: string) =>
  "```prompt " + meta + "\nSummarize this page.\n```";
const promptTag = (html: string) =>
  /<div class="markdown-prompt[^>]*>/.exec(html)?.[0] ?? ``;

describe("prompt + attrs: a class joins the prompt's, and an id is set", () => {
  it.each(engines)("$engine", ({ render }) => {
    const tag = promptTag(render(fence(`{.wide #setup}`)));
    expect(tag).toContain(`class="markdown-prompt wide"`);
    expect(tag).toContain(`id="setup"`);
  });
});

// The attribute block ends the info string; the meta before it still picks the services, opens the prompt and titles it.
describe("prompt + attrs: the meta still applies beside an attribute block", () => {
  it.each(engines)("$engine", ({ render }) => {
    const html = render(fence(`grok open title="Ask" {.wide}`));
    expect(promptTag(html)).toContain(`class="markdown-prompt wide"`);
    expect(html).toContain(`<details class="markdown-prompt-details" open>`);
    expect(html).toContain(`>Ask</summary>`);
    expect(html).toContain(`data-service="grok"`);
    expect(html).not.toContain(`data-service="claude"`);
  });
});

describe("prompt + attrs: values are escaped", () => {
  it.each(engines)("$engine", ({ render }) => {
    expect(promptTag(render(fence(`{data-note="a&b"}`)))).toContain(
      `data-note="a&amp;b"`
    );
  });
});

describe("prompt + attrs: every engine writes the same prompt", () => {
  const input = fence(`cursor {.wide #setup data-kind=app}`);
  const [first] = engines.map(({ render }) => render(input));
  it.each(engines)("$engine", ({ render }) => {
    expect(render(input)).toBe(first);
  });
});

describe("prompt + attrs: another language keeps its attributes on the code", () => {
  it.each(engines)("$engine", ({ render }) => {
    expect(render("```js {.highlight}\nx\n```")).toBe(
      `<pre><code class="highlight language-js">x\n</code></pre>`
    );
  });
});
