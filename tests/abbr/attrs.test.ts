import { expect, test } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { abbr } from "../../packages/mdit-abbr/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkAbbr } from "../../packages/remd-abbr/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(abbr).use(attrs);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkAbbr)
        .use(remarkAttrs)
        .use(remarkRehype)
        .use(rehypeStringify)
        .processSync(src),
    ),
  );

const cases = [
  {
    name: "abbr with block attrs on paragraph",
    input: "*[HTML]: Hyper Text Markup Language\n\nThe HTML specification. {.intro}",
    mdit: '<p class="intro">The <abbr title="Hyper Text Markup Language">HTML</abbr> specification.</p>',
    remd: '<p class="intro">The <abbr title="Hyper Text Markup Language">HTML</abbr> specification.</p>',
  },
  {
    name: "abbr with heading attrs",
    input: "*[API]: Application Programming Interface\n\n## API Reference {#api-ref}",
    mdit: '<h2 id="api-ref"><abbr title="Application Programming Interface">API</abbr> Reference</h2>',
    remd: '<h2 id="api-ref"><abbr title="Application Programming Interface">API</abbr> Reference</h2>',
  },
  {
    name: "abbr definition does not consume attrs block",
    input: "*[CSS]: Cascading Style Sheets\n\nUse CSS for styling.\n\n{.note}",
    mdit: '<p>Use <abbr title="Cascading Style Sheets">CSS</abbr> for styling.</p><p>{.note}</p>',
    remd: '<p>Use <abbr title="Cascading Style Sheets">CSS</abbr> for styling.</p><p>{.note}</p>',
  },
  {
    name: "abbr and softbreak attrs coexist",
    input: "*[JS]: JavaScript\n\nUse JS today.\n{.highlight}",
    mdit: '<p class="highlight">Use <abbr title="JavaScript">JS</abbr> today.</p>',
    remd: '<p class="highlight">Use <abbr title="JavaScript">JS</abbr> today.</p>',
  },
];

test.each(cases)("abbr + attrs (markdown-it): $name", ({ input, mdit: expected }) => {
  expect(normalizeHtml(md.render(input))).toBe(expected);
});

test.each(cases)("abbr + attrs (remark): $name", ({ input, remd: expected }) => {
  expect(remd(input)).toBe(expected);
});
