import { expect, test } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { sub } from "../../packages/mdit-sub/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkSub } from "../../packages/remd-sub/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(sub).use(attrs);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkGfm, { singleTilde: false })
        .use(remarkSub)
        .use(remarkAttrs)
        .use(remarkRehype)
        .use(rehypeStringify)
        .processSync(src),
    ),
  );

const cases = [
  {
    name: "sub inline with block attr on paragraph",
    input: "H~2~O molecule. {.chemical}",
    mdit: '<p class="chemical">H<sub>2</sub>O molecule.</p>',
    remd: '<p class="chemical">H<sub>2</sub>O molecule.</p>',
  },
  {
    name: "sub with heading attrs",
    input: "## Formulas {.formulas}\n\nH~2~O",
    mdit: '<h2 class="formulas">Formulas</h2><p>H<sub>2</sub>O</p>',
    remd: '<h2 class="formulas">Formulas</h2><p>H<sub>2</sub>O</p>',
  },
  {
    name: "sub and block attrs coexist",
    input: "Water is H~2~O and CO~2~. {.chemistry}",
    mdit: '<p class="chemistry">Water is H<sub>2</sub>O and CO<sub>2</sub>.</p>',
    remd: '<p class="chemistry">Water is H<sub>2</sub>O and CO<sub>2</sub>.</p>',
  },
];

test.each(cases)("sub + attrs (markdown-it): $name", ({ input, mdit: expected }) => {
  expect(normalizeHtml(md.render(input))).toBe(expected);
});

test.each(cases)("sub + attrs (remark): $name", ({ input, remd: expected }) => {
  expect(remd(input)).toBe(expected);
});
