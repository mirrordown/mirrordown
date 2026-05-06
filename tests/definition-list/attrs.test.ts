import { expect, test } from "vite-plus/test";
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

const cases = [
  {
    name: "dl with heading attrs",
    input: "## Glossary {.glossary}\n\nTerm\n: Definition",
    mdit: '<h2 class="glossary">Glossary</h2><dl><dt>Term</dt><dd>Definition</dd></dl>',
    remd: '<h2 class="glossary">Glossary</h2><dl><dt>Term</dt><dd>Definition</dd></dl>',
  },
  {
    name: "dl with block attrs on surrounding paragraph",
    input: "Term\n: Definition\n\nFollowing paragraph. {.note}",
    mdit: '<dl><dt>Term</dt><dd>Definition</dd></dl><p class="note">Following paragraph.</p>',
    remd: '<dl><dt>Term</dt><dd>Definition</dd></dl><p class="note">Following paragraph.</p>',
  },
  {
    name: "dl coexists with attrs without interference",
    input: "Apple\n: A red fruit\n\nBanana\n: A yellow fruit",
    mdit: "<dl><dt>Apple</dt><dd>A red fruit</dd><dt>Banana</dt><dd>A yellow fruit</dd></dl>",
    remd: "<dl><dt>Apple</dt><dd>A red fruit</dd><dt>Banana</dt><dd>A yellow fruit</dd></dl>",
  },
];

test.each(cases)("definition-list + attrs (markdown-it): $name", ({ input, mdit: expected }) => {
  expect(normalizeHtml(md.render(input))).toBe(expected);
});

test.each(cases)("definition-list + attrs (remark): $name", ({ input, remd: expected }) => {
  expect(remd(input)).toBe(expected);
});
