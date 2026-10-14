import { fileURLToPath } from "node:url";
import { expect, it, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { inlineSvg } from "../../packages/mdit-inline-svg/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { rehypeInlineSvg } from "../../packages/remd-inline-svg/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { normalizeHtml } from "../utils/index.js";

const env = { currentDocument: import.meta.url };

const md = new MarkdownIt().use(inlineSvg).use(attrs);

const remd = async (src: string) => {
  const file = await unified()
    .use(remarkParse)
    .use(remarkAttrs)
    .use(remarkRehype)
    .use(rehypeInlineSvg)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process({ value: src, path: fileURLToPath(import.meta.url) });
  return normalizeHtml(String(file));
};

describe("inline-svg + attrs: heading with attrs", () => {
  const input = "## Diagrams {.diagrams}";
  const expected = '<h2 class="diagrams">Diagrams</h2>';

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input, env))).toBe(expected));
  it("rehype", async () => expect(remd(input)).resolves.toBe(expected));
});

describe("inline-svg + attrs: paragraph with attrs", () => {
  const input = "Inline images below. {.gallery}";
  const expected = '<p class="gallery">Inline images below.</p>';

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input, env))).toBe(expected));
  it("rehype", async () => expect(remd(input)).resolves.toBe(expected));
});

describe("inline-svg + attrs: plugins coexist without interference", () => {
  const input = "## Gallery {.gallery}\n\nImages here.";

  it("markdown-it", () => {
    const result = normalizeHtml(md.render(input, env));
    expect(result).toContain('class="gallery"');
    expect(result).toContain("<h2");
  });

  it("rehype", async () => {
    const result = await remd(input);
    expect(result).toContain('class="gallery"');
    expect(result).toContain("<h2");
  });
});
