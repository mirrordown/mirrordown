import { fileURLToPath } from "node:url";
import { expect, test } from "vite-plus/test";
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
    .use(rehypeStringify)
    .process({ value: src, path: fileURLToPath(import.meta.url) });
  return normalizeHtml(String(file));
};

test("inline-svg + attrs (markdown-it): heading with attrs", () => {
  const input = "## Diagrams {.diagrams}";
  expect(normalizeHtml(md.render(input, env))).toBe('<h2 class="diagrams">Diagrams</h2>');
});

test("inline-svg + attrs (markdown-it): paragraph with attrs", () => {
  const input = "Inline images below. {.gallery}";
  expect(normalizeHtml(md.render(input, env))).toBe('<p class="gallery">Inline images below.</p>');
});

test("inline-svg + attrs (markdown-it): plugins coexist without interference", () => {
  const input = "## Gallery {.gallery}\n\nImages here.";
  const result = normalizeHtml(md.render(input, env));
  expect(result).toContain('class="gallery"');
  expect(result).toContain("<h2");
});

test("inline-svg + attrs (rehype): heading with attrs", async () => {
  const input = "## Diagrams {.diagrams}";
  expect(await remd(input)).toBe('<h2 class="diagrams">Diagrams</h2>');
});

test("inline-svg + attrs (rehype): paragraph with attrs", async () => {
  const input = "Inline images below. {.gallery}";
  expect(await remd(input)).toBe('<p class="gallery">Inline images below.</p>');
});

test("inline-svg + attrs (rehype): plugins coexist without interference", async () => {
  const input = "## Gallery {.gallery}\n\nImages here.";
  const result = await remd(input);
  expect(result).toContain('class="gallery"');
  expect(result).toContain("<h2");
});
