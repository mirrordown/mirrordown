import { expect, test, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { dl } from "../../packages/mdit-definition-list/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkDefinitionList, defListHastHandlers } from "../../packages/remd-definition-list/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(dl).use(attrs);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkDefinitionList)
        .use(remarkAttrs)
        .use(remarkRehype, { handlers: defListHastHandlers })
        .use(rehypeStringify)
        .processSync(src),
    ),
  );

describe("definition-list + attrs: dl with heading attrs", () => {
  const input = "## Glossary {.glossary}\n\nTerm\n: Definition";
  const expected = '<h2 class="glossary">Glossary</h2><dl><dt>Term</dt><dd>Definition</dd></dl>';

  test("markdown-it", () => expect(normalizeHtml(md.render(input))).toBe(expected));
  test("remark", () => expect(remd(input)).toBe(expected));
});

describe("definition-list + attrs: dl with block attrs on surrounding paragraph", () => {
  const input = "Term\n: Definition\n\nFollowing paragraph. {.note}";
  const expected =
    '<dl><dt>Term</dt><dd>Definition</dd></dl><p class="note">Following paragraph.</p>';

  test("markdown-it", () => expect(normalizeHtml(md.render(input))).toBe(expected));
  test("remark", () => expect(remd(input)).toBe(expected));
});

describe("definition-list + attrs: dl coexists with attrs without interference", () => {
  const input = "Apple\n: A red fruit\n\nBanana\n: A yellow fruit";
  const expected =
    "<dl><dt>Apple</dt><dd>A red fruit</dd><dt>Banana</dt><dd>A yellow fruit</dd></dl>";

  test("markdown-it", () => expect(normalizeHtml(md.render(input))).toBe(expected));
  test("remark", () => expect(remd(input)).toBe(expected));
});

describe("definition-list + attrs: class on dt term applies to dt element", () => {
  const input = "Term {.highlight}\n: Definition";
  const expected = '<dl><dt class="highlight">Term</dt><dd>Definition</dd></dl>';

  test("markdown-it", () => expect(normalizeHtml(md.render(input))).toBe(expected));
  test("remark", () => expect(remd(input)).toBe(expected));
});

describe("definition-list + attrs: id on standalone paragraph after dl applies to dl", () => {
  const input = "Term\n: Definition\n\n{#glossary}";
  const expected = '<dl id="glossary"><dt>Term</dt><dd>Definition</dd></dl>';

  test("markdown-it", () => expect(normalizeHtml(md.render(input))).toBe(expected));
  test("remark", () => expect(remd(input)).toBe(expected));
});

describe("definition-list + attrs: multiple attrs on dt and dl", () => {
  const input = "Apple {.fruit}\n: A red fruit\n\nBanana {.fruit}\n: A yellow fruit\n\n{#produce}";
  const expected =
    '<dl id="produce"><dt class="fruit">Apple</dt><dd>A red fruit</dd><dt class="fruit">Banana</dt><dd>A yellow fruit</dd></dl>';

  test("markdown-it", () => expect(normalizeHtml(md.render(input))).toBe(expected));
  test("remark", () => expect(remd(input)).toBe(expected));
});
