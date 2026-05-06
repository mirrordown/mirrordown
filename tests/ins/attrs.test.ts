import { expect, test } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { ins } from "../../packages/mdit-ins/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkIns } from "../../packages/remd-ins/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(ins).use(attrs);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkIns)
        .use(remarkAttrs)
        .use(remarkRehype)
        .use(rehypeStringify)
        .processSync(src),
    ),
  );

const cases = [
  {
    name: "ins inline with class attr",
    input: "++inserted++{.new}",
    mdit: '<p><ins class="new">inserted</ins></p>',
    remd: '<p><ins class="new">inserted</ins></p>',
  },
  {
    name: "ins inline with id attr",
    input: "++added++{#ins-1}",
    mdit: '<p><ins id="ins-1">added</ins></p>',
    remd: '<p><ins id="ins-1">added</ins></p>',
  },
  {
    name: "ins with heading attrs",
    input: "## New Section {.new}\n\n++inserted content++",
    mdit: '<h2 class="new">New Section</h2><p><ins>inserted content</ins></p>',
    remd: '<h2 class="new">New Section</h2><p><ins>inserted content</ins></p>',
  },
  {
    name: "ins and block attrs coexist",
    input: "Some ++inserted++ text here. {.updated}",
    mdit: '<p class="updated">Some <ins>inserted</ins> text here.</p>',
    remd: '<p class="updated">Some <ins>inserted</ins> text here.</p>',
  },
];

test.each(cases)("ins + attrs (markdown-it): $name", ({ input, mdit: expected }) => {
  expect(normalizeHtml(md.render(input))).toBe(expected);
});

test.each(cases)("ins + attrs (remark): $name", ({ input, remd: expected }) => {
  expect(remd(input)).toBe(expected);
});
