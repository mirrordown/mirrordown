import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { lightbox } from "../../packages/mdit-lightbox/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { rehypeLightbox } from "../../packages/remd-lightbox/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(lightbox).use(attrs);
const mdit = (src: string) => normalizeHtml(md.render(src));

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkAttrs)
        .use(remarkRehype)
        .use(rehypeLightbox)
        .use(rehypeStringify)
        .processSync(src)
    )
  );

const count = (html: string, re: RegExp) => (html.match(re) ?? []).length;

describe("lightbox + attrs: class on an opted-in image", () => {
  const input = "!![Alt](p.jpg){.hero}";
  it("markdown-it", () =>
    expect(mdit(input)).toContain('<img src="p.jpg" alt="Alt" class="hero">'));
  it("remark", () =>
    expect(remd(input)).toContain('<img src="p.jpg" alt="Alt" class="hero">'));
});

describe("lightbox + attrs: author id overrides the generated dialog id", () => {
  // `{#fig1}` names the lightbox: the dialog takes id="fig1" instead of the
  // hashed default, the trigger points at it, and the id moves off the <img>
  // so it isn't duplicated across the trigger and dialog copies.
  const input = "!![Alt](p.jpg){#fig1}";
  it("markdown-it", () => {
    const html = mdit(input);
    expect(html).toContain('<dialog id="fig1" class="markdown-lightbox"');
    expect(html).toContain('<img src="p.jpg" alt="Alt">');
    expect(html).toContain('commandfor="fig1"');
    expect(count(html, /id="fig1"/g)).toBe(1);
  });
  it("remark", () => {
    const html = remd(input);
    expect(html).toContain('<dialog id="fig1" class="markdown-lightbox"');
    expect(html).toContain('<img src="p.jpg" alt="Alt">');
    expect(html).toContain('commandfor="fig1"');
    expect(count(html, /id="fig1"/g)).toBe(1);
  });
});

describe("lightbox + attrs: a named id is shared by repeated references", () => {
  // Same src referenced twice; `{#gallery}` on the first names the shared
  // lightbox, so both triggers control a single dialog.
  const input = "!![a](same.jpg){#gallery}\n\n!![b](same.jpg)";
  it("markdown-it", () => {
    const html = mdit(input);
    expect(count(html, /<dialog/g)).toBe(1);
    expect(count(html, /commandfor="gallery"/g)).toBe(3); // 2 triggers + close
  });
  it("remark", () => {
    const html = remd(input);
    expect(count(html, /<dialog/g)).toBe(1);
    expect(count(html, /commandfor="gallery"/g)).toBe(3); // 2 triggers + close
  });
});

describe("lightbox + attrs: attrs on a non-opted-in image, no lightbox", () => {
  const input = "![Alt](p.jpg){.plain}";
  it("markdown-it", () => {
    const html = mdit(input);
    expect(html).not.toContain("markdown-lightbox");
    expect(html).toBe('<p><img src="p.jpg" alt="Alt" class="plain"></p>');
  });
  it("remark", () => {
    const html = remd(input);
    expect(html).not.toContain("markdown-lightbox");
    expect(html).toBe('<p><img src="p.jpg" alt="Alt" class="plain"></p>');
  });
});

describe("lightbox + attrs: markdown-it and remark agree", () => {
  it.each([
    "!![Alt](p.jpg){.hero}",
    "!![Alt](p.jpg){#fig1}",
    "!![Alt](p.jpg){.a .b}",
    "Text !![Alt](p.jpg){.hero} and ![plain](q.jpg){.x}"
  ])("same output: %s", (input) => {
    expect(mdit(input)).toBe(remd(input));
  });
});

describe("lightbox + attrs: markdown-it plugin order is irrelevant", () => {
  const input = "!![Alt](p.jpg){.hero}";
  it("attrs before lightbox matches lightbox before attrs", () => {
    const a = new MarkdownIt().use(lightbox).use(attrs);
    const b = new MarkdownIt().use(attrs).use(lightbox);
    expect(normalizeHtml(a.render(input))).toBe(normalizeHtml(b.render(input)));
  });
});
