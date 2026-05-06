import { expect, test } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { del } from "../../packages/mdit-del/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkDel } from "../../packages/remd-del/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(del).use(attrs);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkDel)
        .use(remarkAttrs)
        .use(remarkRehype)
        .use(rehypeStringify)
        .processSync(src),
    ),
  );

const cases = [
  {
    name: "del inline with class attr",
    input: "--deleted--{.removed}",
    mdit: '<p><del class="removed">deleted</del></p>',
    remd: '<p><del class="removed">deleted</del></p>',
  },
  {
    name: "del inline with id attr",
    input: "--removed--{#del-1}",
    mdit: '<p><del id="del-1">removed</del></p>',
    remd: '<p><del id="del-1">removed</del></p>',
  },
  {
    name: "del with heading attrs",
    input: "## Old Title {.deprecated}\n\n--deprecated--",
    mdit: '<h2 class="deprecated">Old Title</h2><p><del>deprecated</del></p>',
    remd: '<h2 class="deprecated">Old Title</h2><p><del>deprecated</del></p>',
  },
  {
    name: "del and block attrs coexist",
    input: "Some --deleted-- text and more. {.updated}",
    mdit: '<p class="updated">Some <del>deleted</del> text and more.</p>',
    remd: '<p class="updated">Some <del>deleted</del> text and more.</p>',
  },
];

test.each(cases)("del + attrs (markdown-it): $name", ({ input, mdit: expected }) => {
  expect(normalizeHtml(md.render(input))).toBe(expected);
});

test.each(cases)("del + attrs (remark): $name", ({ input, remd: expected }) => {
  expect(remd(input)).toBe(expected);
});
