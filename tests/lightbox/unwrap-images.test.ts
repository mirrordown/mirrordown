import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { lightbox } from "../../packages/mdit-lightbox/src";
import { unwrapImages } from "../../packages/mdit-unwrap-images/src";
import { rehypeLightbox } from "../../packages/remd-lightbox/src";
import { rehypeUnwrapImages } from "../../packages/remd-unwrap-images/src";
import { normalizeHtml } from "../utils/index.js";

// Lightbox runs before unwrap-images so the trigger button exists when
// unwrap-images decides a paragraph is image-only (it special-cases buttons).
const md = new MarkdownIt().use(lightbox).use(unwrapImages);
const mdit = (src: string) => normalizeHtml(md.render(src));

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(rehypeLightbox)
        .use(rehypeUnwrapImages)
        .use(rehypeStringify)
        .processSync(src)
    )
  );

const count = (html: string, re: RegExp) => (html.match(re) ?? []).length;

describe("lightbox + unwrap-images: opted-in block image is unwrapped", () => {
  // The trigger button is the paragraph's only content, so unwrap-images lifts
  // it out of the <p>. The marker leaves no stray empty text node behind.
  const input = "!![alt](photo.jpg)";
  it("markdown-it", () => {
    const html = mdit(input);
    expect(html).toMatch(/^<button[^>]*class="markdown-lightbox-trigger"/);
    expect(html).toContain("<dialog");
  });
  it("remark", () => {
    const html = remd(input);
    expect(html).toMatch(/^<button[^>]*class="markdown-lightbox-trigger"/);
    expect(html).toContain("<dialog");
  });
});

describe("lightbox + unwrap-images: markdown-it and remark agree", () => {
  // Both engines must converge despite their different wrapping stages: mdit
  // leaves an empty text token, rehype an empty text node — lightbox drops both
  // so the image reads as image-only in either tree.
  it.each([
    "!![alt](photo.jpg)",
    "!![a](same.jpg)\n\n!![b](same.jpg)",
    "![plain](photo.jpg)",
    "text !![alt](photo.jpg) more"
  ])("same output: %j", (input) => {
    expect(mdit(input)).toBe(remd(input));
  });
});

describe("lightbox + unwrap-images: repeated block image shares one dialog", () => {
  const input = "!![a](same.jpg)\n\n!![b](same.jpg)";
  it("markdown-it", () => expect(count(mdit(input), /<dialog/g)).toBe(1));
  it("remark", () => expect(count(remd(input), /<dialog/g)).toBe(1));
});

describe("lightbox + unwrap-images: normal block image unwraps without a lightbox", () => {
  const input = "![alt](photo.jpg)";
  const expected = '<img src="photo.jpg" alt="alt">';
  it("markdown-it", () => expect(mdit(input)).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
});

describe("lightbox + unwrap-images: inline image keeps its paragraph", () => {
  // Surrounding text means the paragraph isn't image-only, so it stays wrapped.
  const input = "text !![alt](photo.jpg) more";
  it("markdown-it", () => expect(mdit(input)).toMatch(/^<p>text /));
  it("remark", () => expect(remd(input)).toMatch(/^<p>text /));
});
