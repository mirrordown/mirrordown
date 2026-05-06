import { expect, test } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { ruby } from "../../packages/mdit-ruby/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkRuby } from "../../packages/remd-ruby/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(ruby).use(attrs);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRuby)
        .use(remarkAttrs)
        .use(remarkRehype)
        .use(rehypeStringify)
        .processSync(src),
    ),
  );

const cases = [
  {
    name: "ruby with heading attrs",
    input: "## Kanji {.kanji}\n\n{漢字|かんじ}",
    mdit: '<h2 class="kanji">Kanji</h2><p><ruby>漢字<rt>かんじ</rt></ruby></p>',
    remd: '<h2 class="kanji">Kanji</h2><p><ruby>漢字<rt>かんじ</rt></ruby></p>',
  },
  {
    name: "ruby and block attrs coexist",
    input: "Read {漢字|かんじ} carefully. {.note}",
    mdit: '<p class="note">Read <ruby>漢字<rt>かんじ</rt></ruby> carefully.</p>',
    remd: '<p class="note">Read <ruby>漢字<rt>かんじ</rt></ruby> carefully.</p>',
  },
  {
    name: "ruby and attrs coexist without interference",
    input: "{日本|にほん}語\n\n{漢字|かんじ}",
    mdit: "<p><ruby>日本<rt>にほん</rt></ruby>語</p><p><ruby>漢字<rt>かんじ</rt></ruby></p>",
    remd: "<p><ruby>日本<rt>にほん</rt></ruby>語</p><p><ruby>漢字<rt>かんじ</rt></ruby></p>",
  },
];

test.each(cases)("ruby + attrs (markdown-it): $name", ({ input, mdit: expected }) => {
  expect(normalizeHtml(md.render(input))).toBe(expected);
});

test.each(cases)("ruby + attrs (remark): $name", ({ input, remd: expected }) => {
  expect(remd(input)).toBe(expected);
});
