import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { spoiler } from "../../packages/mdit-spoiler/src";
import { unwrapImages } from "../../packages/mdit-unwrap-images/src";
import {
  remarkSpoiler,
  spoilerHastHandlers
} from "../../packages/remd-spoiler/src";
import { rehypeUnwrapImages } from "../../packages/remd-unwrap-images/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(spoiler).use(unwrapImages);
const mdit = (src: string) => normalizeHtml(md.render(src));

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkSpoiler)
        .use(remarkRehype, { handlers: spoilerHastHandlers })
        .use(rehypeUnwrapImages)
        .use(rehypeStringify)
        .processSync(src)
    )
  );

// A spoiler-wrapped image is NOT a bare block image — the <label> wrapper is the
// paragraph's content, so unwrap-images leaves the <p> in place. This guards the
// marker-residue trap: if the spoiler left a stray empty text node, the
// paragraph could read as "image-only" and be wrongly unwrapped.
describe("spoiler + unwrap-images: a spoilered image stays wrapped", () => {
  const input = "||![art](photo.jpg)||";
  const expected =
    '<p><label class="markdown-spoiler"><input type="checkbox" ' +
    'class="markdown-spoiler-toggle" aria-label="spoiler">' +
    '<span class="markdown-spoiler-content">' +
    '<img src="photo.jpg" alt="art"></span></label></p>';

  it("markdown-it", () => expect(mdit(input)).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
});

// A bare block image still unwraps normally when a spoiler is not involved.
describe("spoiler + unwrap-images: a bare image still unwraps", () => {
  const input = "![bare](photo.jpg)";
  const expected = '<img src="photo.jpg" alt="bare">';

  it("markdown-it", () => expect(mdit(input)).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
});

// Mixed document: the bare image is unwrapped out of its paragraph while the
// spoilered image keeps its wrapping paragraph. Both engines converge.
describe("spoiler + unwrap-images: bare unwraps, spoilered stays", () => {
  const input = "![bare](a.jpg)\n\n||![sp](b.jpg)||";

  it("markdown-it and remark agree", () => {
    expect(remd(input)).toBe(mdit(input));
  });

  it("bare image is unwrapped", () => {
    const html = mdit(input);
    expect(html).toMatch(/^<img src="a\.jpg"/);
  });

  it("spoilered image keeps its paragraph", () => {
    const html = mdit(input);
    expect(html).toContain(
      '<p><label class="markdown-spoiler"><input type="checkbox" ' +
        'class="markdown-spoiler-toggle" aria-label="spoiler">' +
        '<span class="markdown-spoiler-content"><img src="b.jpg"'
    );
  });
});
