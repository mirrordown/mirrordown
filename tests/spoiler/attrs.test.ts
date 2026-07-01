import { expect, it, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { spoiler } from "../../packages/mdit-spoiler/src";
import { attrs } from "../../packages/mdit-attrs/src";
import {
  remarkSpoiler,
  spoilerHastHandlers
} from "../../packages/remd-spoiler/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(spoiler).use(attrs);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkSpoiler)
        .use(remarkAttrs)
        .use(remarkRehype, { handlers: spoilerHastHandlers })
        .use(rehypeStringify)
        .processSync(src)
    )
  );

const SPOILER = (inner: string) =>
  `<label class="markdown-spoiler">` +
  `<input type="checkbox" class="markdown-spoiler-toggle" aria-label="spoiler">` +
  `<span class="markdown-spoiler-content">${inner}</span></label>`;

// Block-level attrs on the surrounding paragraph coexist with a spoiler and
// land on the <p> in both engines.
describe("spoiler + attrs: block attrs coexist with a spoiler", () => {
  const input = "See ||spoiler|| here. {.callout}";
  const expected = `<p class="callout">See ${SPOILER("spoiler")} here.</p>`;

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
});

// Inline attrs written directly after a spoiler do NOT attach to it in either
// engine (unlike `mark`, whose close token attrs recognizes). Both engines drop
// the trailing `{...}` onto the spoiler as a no-op, so parity is preserved. This
// encodes the invariant that the two engines agree here, not that attachment is
// desired.
describe("spoiler + attrs: inline attrs after a spoiler are a no-op", () => {
  const input = "||secret||{.danger}";
  const expected = `<p>${SPOILER("secret")}</p>`;

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
});

// A spoiler in a heading that carries heading attrs: the attrs land on the
// heading and the spoiler renders normally, identically in both engines. The
// spoiler is followed by trailing text so the `{...}` attaches to the heading
// (attrs won't attach when the spoiler is the heading's final token).
describe("spoiler + attrs: spoiler in a heading with heading attrs", () => {
  const input = "## The ||twist|| ending {.chapter}";
  const expected = `<h2 class="chapter">The ${SPOILER("twist")} ending</h2>`;

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
});
