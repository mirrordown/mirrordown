import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { caption } from "../../packages/mdit-caption/src";
import { lightbox } from "../../packages/mdit-lightbox/src";
import { squeezeParagraphs } from "../../packages/mdit-squeeze-paragraphs/src";
import { remarkCaption } from "../../packages/remd-caption/src";
import { rehypeLightbox } from "../../packages/remd-lightbox/src";
import { rehypeSqueezeParagraphs } from "../../packages/remd-squeeze-paragraphs/src";
import { satteriCaption } from "../../packages/sat-caption/src";
import { satteriLightbox } from "../../packages/sat-lightbox/src";
import { satteriSqueezeParagraphs } from "../../packages/sat-squeeze-paragraphs/src";

// Caption, then lightbox, then squeeze-paragraphs, as the presets order them.
const options = { caption: true };
const markdownIt = (input: string) =>
  new MarkdownIt()
    .use(caption)
    .use(lightbox, options)
    .use(squeezeParagraphs)
    .render(input);
const remark = (input: string) =>
  String(
    unified()
      .use(remarkParse)
      .use(remarkCaption)
      .use(remarkRehype)
      .use(rehypeLightbox, options)
      .use(rehypeSqueezeParagraphs)
      .use(rehypeStringify)
      .processSync(input)
  );
const satteri = (input: string) =>
  markdownToHtml(input, {
    features: { smartPunctuation: false },
    mdastPlugins: [satteriCaption()],
    hastPlugins: [satteriLightbox(options), satteriSqueezeParagraphs()]
  }).html;

// A caption that renders nothing leaves an empty `<p class="markdown-lightbox-caption">` in the dialog.
const input = "!![a](a.png)\n~: &#32;";
const emptyCaption = /<p class="markdown-lightbox-caption">\s*<\/p>/;

describe("squeeze-paragraphs + lightbox: an empty dialog caption", () => {
  it.each([
    { engine: `remark`, render: remark },
    { engine: `sätteri`, render: satteri }
  ])("$engine removes it, as an empty <p> in the tree", ({ render }) => {
    expect(render(input)).toContain(`<dialog`);
    expect(render(input)).not.toMatch(emptyCaption);
  });

  // markdown-it's lightbox writes the caption `<p>` as a string in its `lightbox_dialogs` renderer rule, after every core rule has run, so squeeze-paragraphs can never remove it: the lightbox plugin itself writes no `<p>` for a caption that renders only whitespace.
  it("markdown-it never writes it: the lightbox plugin skips a caption that renders nothing", () => {
    expect(markdownIt(input)).toContain(`<dialog`);
    expect(markdownIt(input)).not.toMatch(emptyCaption);
  });
});
