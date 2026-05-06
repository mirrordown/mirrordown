import { expect, test } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { mark } from "../../packages/mdit-mark/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkMark } from "../../packages/remd-mark/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(mark).use(attrs);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkMark)
        .use(remarkAttrs)
        .use(remarkRehype)
        .use(rehypeStringify)
        .processSync(src),
    ),
  );

const cases = [
  {
    name: "mark inline with class attr",
    input: "==highlighted=={.highlight}",
    mdit: '<p><mark class="highlight">highlighted</mark></p>',
    remd: '<p><mark class="highlight">highlighted</mark></p>',
  },
  {
    name: "mark inline with id attr",
    input: "==important=={#key-point}",
    mdit: '<p><mark id="key-point">important</mark></p>',
    remd: '<p><mark id="key-point">important</mark></p>',
  },
  {
    name: "mark with heading attrs",
    input: "## Key Terms {.terms}\n\n==highlighted== text.",
    mdit: '<h2 class="terms">Key Terms</h2><p><mark>highlighted</mark> text.</p>',
    remd: '<h2 class="terms">Key Terms</h2><p><mark>highlighted</mark> text.</p>',
  },
  {
    name: "mark and block attrs coexist",
    input: "See ==important== note here. {.callout}",
    mdit: '<p class="callout">See <mark>important</mark> note here.</p>',
    remd: '<p class="callout">See <mark>important</mark> note here.</p>',
  },
];

test.each(cases)("mark + attrs (markdown-it): $name", ({ input, mdit: expected }) => {
  expect(normalizeHtml(md.render(input))).toBe(expected);
});

test.each(cases)("mark + attrs (remark): $name", ({ input, remd: expected }) => {
  expect(remd(input)).toBe(expected);
});
