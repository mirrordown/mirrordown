import { expect, it, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { steps } from "../../packages/mdit-steps/src";
import { sectionize } from "../../packages/mdit-sectionize/src";
import { remarkSteps, stepsHastHandlers } from "../../packages/remd-steps/src";
import { rehypeSectionize } from "../../packages/remd-sectionize/src";
import { satteriSteps } from "../../packages/sat-steps/src";
import { satteriSectionize } from "../../packages/sat-sectionize/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(steps).use(sectionize);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkSteps)
        .use(remarkRehype, { handlers: stepsHastHandlers as never })
        .use(rehypeSectionize)
        .use(rehypeStringify)
        .processSync(src)
    )
  );

const sat = (src: string) =>
  normalizeHtml(
    markdownToHtml(src, {
      features: { gfm: false, frontmatter: false, smartPunctuation: false },
      mdastPlugins: [satteriSteps()],
      hastPlugins: [satteriSectionize()]
    }).html
  );

// Sections only group top-level headings: a section opened around a heading in a step body would close outside the step's list, which is invalid HTML.
describe("steps + sectionize: a heading in a step body stays inside the step", () => {
  const input = "# Guide\n\n@1. Title\n> ## Inside\n> Body.";
  const expected =
    '<section data-depth="1"><h1>Guide</h1><ol class="markdown-steps"><li class="markdown-steps-item" data-step="1"><p class="markdown-steps-title">Title</p><div class="markdown-steps-body"><h2>Inside</h2><p>Body.</p></div></li></ol></section>';

  it.each([
    ["markdown-it", (src: string) => normalizeHtml(md.render(src))],
    ["remark", remd],
    ["Sätteri", sat]
  ])("%s", (_, render) => {
    expect(render(input)).toBe(expected);
  });
});
