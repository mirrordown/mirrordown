import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { imageSize } from "../../packages/mdit-image-size/src";
import { inlineSvg } from "../../packages/mdit-inline-svg/src";
import { remarkImageSize } from "../../packages/remd-image-size/src";
import { rehypeInlineSvg } from "../../packages/remd-inline-svg/src";
import { satteriImageSize } from "../../packages/sat-image-size/src";
import { satteriInlineSvg } from "../../packages/sat-inline-svg/src";
import { normalizeHtml } from "../utils/index.js";

// The document sits beside the inline-svg fixtures, so the image resolves to a real SVG file: `circle.inline.svg` is 250 by 250, with no optimisation it is inlined as written.
const document = new URL("../inline-svg/document.md", import.meta.url);
const input = "![A circle|100x50](./fixtures/circle.inline.svg)";

const markdownIt = (): string =>
  normalizeHtml(
    new MarkdownIt()
      .use(imageSize)
      .use(inlineSvg, { optimize: false })
      .render(input, { currentDocument: document.href })
  );
const remark = async (): Promise<string> =>
  normalizeHtml(
    String(
      await unified()
        .use(remarkParse)
        .use(remarkImageSize)
        .use(remarkRehype)
        .use(rehypeInlineSvg, { optimize: false })
        .use(rehypeStringify, { allowDangerousHtml: true })
        .process({ value: input, path: fileURLToPath(document) })
    )
  );
const satteri = (): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: { gfm: false, frontmatter: false, smartPunctuation: false },
      mdastPlugins: [satteriImageSize()],
      hastPlugins: [satteriInlineSvg({ optimize: false })],
      fileURL: document
    }).html
  );

// inline-svg replaces the `<img>` with the file's own `<svg>`, which keeps the size written in the file: the size from the description goes with the `<img>`, and only the alt, without the size, reaches the `<svg>` as its accessible name. Pinned as it is so a change shows up; whether an inlined SVG should take the description's size is the owner's to decide.
describe("image-size + inline-svg: an inlined SVG keeps the file's size", () => {
  it("in all three engines", async () => {
    const html = markdownIt();
    expect(html).toBe(
      '<p><svg width="250" height="250" viewBox="0 0 250 250" xmlns="http://www.w3.org/2000/svg" aria-label="A circle"><circle fill-opacity="0.5" cx="125" cy="125" r="100" fill="#BA5B5B"/></svg></p>'
    );
    await expect(remark()).resolves.toBe(html);
    expect(satteri()).toBe(html);
  });
});
