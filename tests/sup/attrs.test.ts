import { expect, test } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { sup } from "../../packages/mdit-sup/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkSup } from "../../packages/remd-sup/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(sup).use(attrs);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkSup)
        .use(remarkAttrs)
        .use(remarkRehype)
        .use(rehypeStringify)
        .processSync(src),
    ),
  );

const cases = [
  {
    name: "sup inline with class attr",
    input: "E=mc^2^{.physics}",
    mdit: '<p>E=mc<sup class="physics">2</sup></p>',
    remd: '<p>E=mc<sup class="physics">2</sup></p>',
  },
  {
    name: "sup with heading attrs",
    input: "## References {.refs}\n\nSee note^1^.",
    mdit: '<h2 class="refs">References</h2><p>See note<sup>1</sup>.</p>',
    remd: '<h2 class="refs">References</h2><p>See note<sup>1</sup>.</p>',
  },
  {
    name: "sup and block attrs coexist",
    input: "Area is r^2^ × π. {.math}",
    mdit: '<p class="math">Area is r<sup>2</sup> × π.</p>',
    remd: '<p class="math">Area is r<sup>2</sup> × π.</p>',
  },
];

test.each(cases)("sup + attrs (markdown-it): $name", ({ input, mdit: expected }) => {
  expect(normalizeHtml(md.render(input))).toBe(expected);
});

test.each(cases)("sup + attrs (remark): $name", ({ input, remd: expected }) => {
  expect(remd(input)).toBe(expected);
});
