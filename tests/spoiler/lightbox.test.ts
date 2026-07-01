import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { spoiler } from "../../packages/mdit-spoiler/src";
import { lightbox } from "../../packages/mdit-lightbox/src";
import {
  remarkSpoiler,
  spoilerHastHandlers
} from "../../packages/remd-spoiler/src";
import { rehypeLightbox } from "../../packages/remd-lightbox/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(spoiler).use(lightbox);
const mdit = (src: string) => normalizeHtml(md.render(src));

// remd-lightbox is a rehype plugin, so it runs after the spoiler node has been
// converted to its <label><span> subtree and finds the <img> inside it.
const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkSpoiler)
        .use(remarkRehype, { handlers: spoilerHastHandlers })
        .use(rehypeLightbox)
        .use(rehypeStringify)
        .processSync(src)
    )
  );

// A spoilered lightbox image: the image opts into a lightbox (leading `!!`) and
// is wrapped in a spoiler. The trigger button lives inside the spoiler's content
// span; the dialog is still emitted at the document end. Both engines converge.
describe("spoiler + lightbox: a spoilered image is also a lightbox trigger", () => {
  const input = "||!![art](photo.jpg)||";

  it("markdown-it", () => {
    const html = mdit(input);
    expect(html).toContain(
      '<span class="markdown-spoiler-content"><button type="button" class="markdown-lightbox-trigger"'
    );
    expect(html).toContain("<dialog");
  });

  it("remark", () => {
    const html = remd(input);
    expect(html).toContain(
      '<span class="markdown-spoiler-content"><button type="button" class="markdown-lightbox-trigger"'
    );
    expect(html).toContain("<dialog");
  });

  it("markdown-it and remark agree", () => {
    expect(remd(input)).toBe(mdit(input));
  });
});

// The lightbox dialog is emitted once, outside the spoiler, even with text
// around the spoiler — both engines keep the dialog at the document end.
describe("spoiler + lightbox: dialog emitted once at document end", () => {
  const input = "before ||!![art](photo.jpg)|| after";

  it("markdown-it", () => {
    const html = mdit(input);
    expect(html.match(/<dialog/g) ?? []).toHaveLength(1);
  });

  it("remark", () => {
    const html = remd(input);
    expect(html.match(/<dialog/g) ?? []).toHaveLength(1);
  });

  it("markdown-it and remark agree", () => {
    expect(remd(input)).toBe(mdit(input));
  });
});

// `!!` before a non-image spoiler is inert (lightbox only opts in images), so
// the marker stays literal and only the spoiler forms. Both engines agree.
describe("spoiler + lightbox: !! before a text spoiler stays literal", () => {
  const input = "!!||spoiler||";
  const expected =
    '<p>!!<label class="markdown-spoiler"><input type="checkbox" ' +
    'class="markdown-spoiler-toggle" aria-label="spoiler">' +
    '<span class="markdown-spoiler-content">spoiler</span></label></p>';

  it("markdown-it", () => expect(mdit(input)).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
});
