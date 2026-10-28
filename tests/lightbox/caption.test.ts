import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { caption } from "../../packages/mdit-caption/src";
import {
  lightbox,
  type LightboxOptions
} from "../../packages/mdit-lightbox/src";
import { remarkCaption } from "../../packages/remd-caption/src";
import { rehypeLightbox } from "../../packages/remd-lightbox/src";
import { satteriCaption } from "../../packages/sat-caption/src";
import { satteriLightbox } from "../../packages/sat-lightbox/src";
import { normalizeHtml } from "../utils/index.js";

// Caption runs before lightbox in every engine, as the presets order them; no unwrap-images, so the trigger's place in the figure is the caption plugin's doing.
const engines = (options: LightboxOptions = {}) =>
  [
    {
      engine: `markdown-it`,
      render: (input: string) =>
        new MarkdownIt().use(caption).use(lightbox, options).render(input)
    },
    {
      engine: `remark`,
      render: (input: string) =>
        String(
          unified()
            .use(remarkParse)
            .use(remarkCaption)
            .use(remarkRehype)
            .use(rehypeLightbox, options)
            .use(rehypeStringify)
            .processSync(input)
        )
    },
    {
      engine: `sätteri`,
      render: (input: string) =>
        markdownToHtml(input, {
          features: { smartPunctuation: false },
          mdastPlugins: [satteriCaption()],
          hastPlugins: [satteriLightbox(options)]
        }).html
    }
  ].map(({ engine, render }) => ({
    engine,
    render: (input: string) => normalizeHtml(render(input))
  }));

const captioned =
  "!![A lighthouse](lighthouse.jpg)\n~: The *Point Reyes* light";

describe("lightbox + caption: a captioned lightbox image's trigger is the figure's content", () => {
  const all = engines();
  const [first] = all.map(({ render }) => render(captioned));
  it.each(all)("$engine", ({ render }) => {
    const html = render(captioned);
    expect(html).toBe(first);
    expect(html).toMatch(
      /^<figure class="markdown-caption"><button type="button" class="markdown-lightbox-trigger" command="show-modal" commandfor="(markdown-lightbox-[a-z0-9]+)"><img src="lighthouse.jpg" alt="A lighthouse"><\/button><figcaption>The <em>Point Reyes<\/em> light<\/figcaption><\/figure><dialog id="\1"/
    );
  });
});

describe("lightbox + caption: the dialog shows only the image by default", () => {
  it.each(engines())("$engine", ({ render }) => {
    expect(render(captioned)).not.toContain(`markdown-lightbox-caption`);
  });
});

describe("lightbox + caption: with `caption: true`, the dialog shows the caption under the image", () => {
  const all = engines({ caption: true });
  const [first] = all.map(({ render }) => render(captioned));
  it.each(all)("$engine", ({ render }) => {
    const html = render(captioned);
    expect(html).toBe(first);
    expect(html).toMatch(
      /<\/button><p class="markdown-lightbox-caption">The <em>Point Reyes<\/em> light<\/p><\/dialog>$/
    );
  });
});

describe("lightbox + caption: with `caption: true`, an image that isn't a figure's content has no dialog caption", () => {
  const inSentence =
    "Look at !![A lighthouse](lighthouse.jpg) here.\n~: The paragraph's caption";
  const all = engines({ caption: true });
  const [first] = all.map(({ render }) => render(inSentence));
  it.each(all)("$engine", ({ render }) => {
    const html = render(inSentence);
    expect(html).toBe(first);
    expect(html).not.toContain(`markdown-lightbox-caption`);
  });
});

describe("lightbox + caption: with `caption: true`, a repeated image's shared dialog shows the first caption any of them has", () => {
  const repeated =
    "!![A lighthouse](lighthouse.jpg)\n\n!![A lighthouse](lighthouse.jpg)\n~: The second one is captioned";
  const all = engines({ caption: true });
  const [first] = all.map(({ render }) => render(repeated));
  it.each(all)("$engine", ({ render }) => {
    const html = render(repeated);
    expect(html).toBe(first);
    expect(html.match(/<dialog/g)).toHaveLength(1);
    expect(html).toContain(
      `<p class="markdown-lightbox-caption">The second one is captioned</p></dialog>`
    );
  });
});
