import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { spoiler } from "../../packages/mdit-spoiler/src";
import { inlineSvg } from "../../packages/mdit-inline-svg/src";
import {
  remarkSpoiler,
  spoilerHastHandlers
} from "../../packages/remd-spoiler/src";
import { rehypeInlineSvg } from "../../packages/remd-inline-svg/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(spoiler).use(inlineSvg);
const env = { currentDocument: import.meta.url };
const mdit = (src: string) => normalizeHtml(md.render(src, env));

const remd = async (src: string) =>
  normalizeHtml(
    String(
      await unified()
        .use(remarkParse)
        .use(remarkSpoiler)
        .use(remarkRehype, { handlers: spoilerHastHandlers })
        .use(rehypeInlineSvg)
        .use(rehypeStringify)
        .process({ value: src, path: fileURLToPath(import.meta.url) })
    )
  );

// A spoilered SVG image is inlined as an <svg> inside the spoiler content span.
// The exact SVG serialization differs between engines (attribute names, number
// formatting, void-element form) — that is inline-svg's own cross-engine
// difference, not the spoiler's. Assert only what belongs to the spoiler: the
// wrapper structure and that an <svg> lands inside the content span.
const input = "||![circle](./fixtures/circle.inline.svg)||";
const WRAPPER_OPEN =
  '<p><label class="markdown-spoiler"><input type="checkbox" ' +
  'class="markdown-spoiler-toggle" aria-label="spoiler">' +
  '<span class="markdown-spoiler-content"><svg';

describe("spoiler + inline-svg: SVG inlines inside the spoiler", () => {
  it("markdown-it", () => {
    const html = mdit(input);
    expect(html).toContain(WRAPPER_OPEN);
    expect(html).toContain("</svg></span></label></p>");
  });

  it("remark", async () => {
    const html = await remd(input);
    expect(html).toContain(WRAPPER_OPEN);
    expect(html).toContain("</svg></span></label></p>");
  });
});
