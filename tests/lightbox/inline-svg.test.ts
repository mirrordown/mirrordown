import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { inlineSvg } from "../../packages/mdit-inline-svg/src";
import { lightbox } from "../../packages/mdit-lightbox/src";
import { rehypeInlineSvg } from "../../packages/remd-inline-svg/src";
import { rehypeLightbox } from "../../packages/remd-lightbox/src";
import { satteriInlineSvg } from "../../packages/sat-inline-svg/src";
import { satteriLightbox } from "../../packages/sat-lightbox/src";
import { normalizeHtml } from "../utils/index.js";

// The document sits beside the inline-svg fixtures, so the image resolves to a real SVG file.
const document = new URL("../inline-svg/document.md", import.meta.url);
const input = "!![c](./fixtures/circle.inline.svg)";

const markdownIt = (...plugins: (typeof lightbox | typeof inlineSvg)[]) => {
  const md = new MarkdownIt();
  for (const plugin of plugins) md.use(plugin);
  return normalizeHtml(md.render(input, { currentDocument: document.href }));
};
const remark = async (
  ...plugins: (typeof rehypeLightbox | typeof rehypeInlineSvg)[]
) => {
  const processor = unified().use(remarkParse).use(remarkRehype);
  for (const plugin of plugins) processor.use(plugin);
  const file = await processor
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process({ value: input, path: fileURLToPath(document) });
  return normalizeHtml(String(file));
};
const satteri = (
  ...plugins: (
    | ReturnType<typeof satteriLightbox>
    | ReturnType<typeof satteriInlineSvg>
  )[]
) =>
  normalizeHtml(
    markdownToHtml(input, {
      features: { gfm: false, frontmatter: false, smartPunctuation: false },
      hastPlugins: plugins,
      fileURL: document
    }).html
  );

// Each engine has one order in which a lightbox image that is also inlined works: the thumbnail and the dialog both show the inlined SVG. The order differs because markdown-it's plugins wrap the image renderer (the last one installed runs first), while the tree engines transform in sequence (lightbox needs the `<img>` to still be there).
describe("lightbox + inline-svg: in the supported order, the trigger and the dialog both hold the inlined SVG", () => {
  it("markdown-it (inline-svg, then lightbox), remark and Sätteri (lightbox, then inline-svg) agree", async () => {
    const html = markdownIt(inlineSvg, lightbox);
    expect(html).toMatch(
      /^<p><button type="button" class="markdown-lightbox-trigger" command="show-modal" commandfor="(markdown-lightbox-[a-z0-9]+)"><svg [^]*<\/svg><\/button><\/p><dialog id="\1" class="markdown-lightbox" closedby="any"><button type="button" class="markdown-lightbox-close" command="close" commandfor="\1" aria-label="Close image"><svg [^]*<\/svg><\/button><\/dialog>$/
    );
    expect(html).not.toContain(`<img`);
    await expect(remark(rehypeLightbox, rehypeInlineSvg)).resolves.toBe(html);
    expect(satteri(satteriLightbox(), satteriInlineSvg())).toBe(html);
  });
});

// The other order breaks silently, and differently per engine. Pinned so a change shows up; the guide states the supported order.
describe("lightbox + inline-svg: the unsupported order loses the lightbox", () => {
  it("markdown-it (lightbox, then inline-svg): inline-svg's renderer replaces the trigger, and the dialog is left without one", () => {
    const html = markdownIt(lightbox, inlineSvg);
    expect(html).not.toContain(`markdown-lightbox-trigger`);
    expect(html).toMatch(/^<p><svg /);
    expect(html).toContain(`<dialog `);
  });

  it("remark (inline-svg, then lightbox): no <img> is left to opt in, so the `!` stays literal", async () => {
    const html = await remark(rehypeInlineSvg, rehypeLightbox);
    expect(html).toMatch(/^<p>!<svg /);
    expect(html).not.toContain(`markdown-lightbox`);
  });

  it("sätteri (inline-svg, then lightbox): no <img> is left to opt in, so the `!` stays literal", () => {
    const html = satteri(satteriInlineSvg(), satteriLightbox());
    expect(html).toMatch(/^<p>!<svg /);
    expect(html).not.toContain(`markdown-lightbox`);
  });
});
