import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { caption } from "../../packages/mdit-caption/src";
import { githubAlerts } from "../../packages/mdit-github-alerts/src";
import { lightbox } from "../../packages/mdit-lightbox/src";
import { steps } from "../../packages/mdit-steps/src";
import { unwrapImages } from "../../packages/mdit-unwrap-images/src";
import { remarkCaption } from "../../packages/remd-caption/src";
import {
  githubAlertsHastHandlers,
  remarkGithubAlerts
} from "../../packages/remd-github-alerts/src";
import { rehypeLightbox } from "../../packages/remd-lightbox/src";
import { remarkSteps, stepsHastHandlers } from "../../packages/remd-steps/src";
import { rehypeUnwrapImages } from "../../packages/remd-unwrap-images/src";
import { satteriCaption } from "../../packages/sat-caption/src";
import { satteriGithubAlerts } from "../../packages/sat-github-alerts/src";
import { satteriLightbox } from "../../packages/sat-lightbox/src";
import { satteriSteps } from "../../packages/sat-steps/src";
import { satteriUnwrapImages } from "../../packages/sat-unwrap-images/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cases = parseFixture(
  read("fixtures/built-paragraphs.md"),
  read("expected/built-paragraphs.html")
);

// The plugins that build a `<p>` of their own around what an author wrote (a step's title, an alert's title, a lightbox dialog's caption), in the presets' order, with the alert icons off so a title can hold only images. `containerClass` names the steps' and the alerts' classes.
const engines = (containerClass?: string) => {
  const own = containerClass === undefined ? {} : { containerClass };
  const md = new MarkdownIt()
    .use(githubAlerts, { icons: false, ...own })
    .use(steps, own)
    .use(caption)
    .use(lightbox, { caption: true })
    .use(unwrapImages);
  const processor = unified()
    .use(remarkParse)
    .use(remarkSteps, own)
    .use(remarkGithubAlerts, { icons: false, ...own })
    .use(remarkCaption)
    .use(remarkRehype, {
      handlers: { ...githubAlertsHastHandlers, ...stepsHastHandlers }
    })
    .use(rehypeLightbox, { caption: true })
    .use(rehypeUnwrapImages)
    .use(rehypeStringify);
  return [
    ["markdown-it", (input: string) => normalizeHtml(md.render(input))],
    [
      "remark",
      (input: string) => normalizeHtml(String(processor.processSync(input)))
    ],
    [
      "Sätteri",
      (input: string) =>
        normalizeHtml(
          markdownToHtml(input, {
            features: {
              gfm: false,
              frontmatter: false,
              smartPunctuation: false
            },
            mdastPlugins: [
              satteriSteps(own),
              satteriGithubAlerts({ icons: false, ...own }),
              satteriCaption()
            ],
            hastPlugins: [
              satteriLightbox({ caption: true }),
              satteriUnwrapImages()
            ]
          }).html
        )
    ]
  ] as const;
};

// A title or a caption that holds only images is still a title or a caption, not an image paragraph: markdown-it never reads one as a paragraph, and the hast engines leave the `<p>` its plugin marked as not a Markdown paragraph, with one image or several.
describe.each(engines())(
  "unwrap-images and the paragraphs plugins build (%s)",
  (_, render) => {
    it.each(cases)("$name", ({ input, expected }) => {
      expect(render(input)).toBe(expected);
    });
  }
);

// The mark is not the class, so a step's or an alert's title is kept whatever its class is named.
describe.each(engines("how"))(
  "unwrap-images with a custom containerClass (%s)",
  (_, render) => {
    it("keeps a step title of one image", () => {
      expect(render("@1. ![a](a.png)\n>  body")).toBe(
        '<ol class="how"><li class="how-item" data-step="1"><p class="how-title"><img src="a.png" alt="a"></p><div class="how-body"><p>body</p></div></li></ol>'
      );
    });

    it("keeps an alert title of one image", () => {
      expect(render("> [!note] ![a](a.png)\n> body")).toBe(
        '<div class="how" data-alert="note"><p class="how-title" aria-label="a"><img src="a.png" alt="a"></p><p>body</p></div>'
      );
    });
  }
);
