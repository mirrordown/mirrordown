import { expect, it, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { steps } from "../../packages/mdit-steps/src";
import { spoiler } from "../../packages/mdit-spoiler/src";
import { remarkSteps, stepsHastHandlers } from "../../packages/remd-steps/src";
import {
  remarkSpoiler,
  spoilerHastHandlers
} from "../../packages/remd-spoiler/src";
import { satteriSteps } from "../../packages/sat-steps/src";
import { satteriSpoiler } from "../../packages/sat-spoiler/src";
import { normalizeHtml } from "../utils/index.js";

// Spoiler runs after steps here, as in the presets: steps keeps a step's title in the tree, so a plugin that runs after it still reaches the title's inline syntax.
const md = new MarkdownIt().use(steps).use(spoiler);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkSteps)
        .use(remarkSpoiler)
        .use(remarkRehype, {
          handlers: { ...stepsHastHandlers, ...spoilerHastHandlers } as never
        })
        .use(rehypeStringify)
        .processSync(src)
    )
  );

const sat = (src: string) =>
  normalizeHtml(
    markdownToHtml(src, {
      features: { gfm: false, frontmatter: false, smartPunctuation: false },
      mdastPlugins: [satteriSteps(), satteriSpoiler()]
    }).html
  );

describe("steps + spoiler: spoiler in a step title, with spoiler running after steps", () => {
  const input = "@1. A ||secret|| title\n> Body.";
  const expected =
    '<p class="markdown-steps-title">A <label class="markdown-spoiler"><input type="checkbox" class="markdown-spoiler-toggle" aria-label="spoiler"><span class="markdown-spoiler-content">secret</span></label> title</p>';

  it.each([
    ["markdown-it", (src: string) => normalizeHtml(md.render(src))],
    ["remark", remd],
    ["Sätteri", sat]
  ])("%s", (_, render) => {
    expect(render(input)).toContain(expected);
  });
});
