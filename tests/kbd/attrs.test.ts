import { expect, test } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { kbd } from "../../packages/mdit-kbd/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkKbd } from "../../packages/remd-kbd/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(kbd).use(attrs);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkKbd)
        .use(remarkAttrs)
        .use(remarkRehype)
        .use(rehypeStringify)
        .processSync(src),
    ),
  );

const cases = [
  {
    name: "kbd inline with class attr",
    input: "[[Ctrl]]{.key}",
    mdit: '<p><kbd class="key">Ctrl</kbd></p>',
    remd: '<p><kbd class="key">Ctrl</kbd></p>',
  },
  {
    name: "kbd inline with id attr",
    input: "[[Enter]]{#enter-key}",
    mdit: '<p><kbd id="enter-key">Enter</kbd></p>',
    remd: '<p><kbd id="enter-key">Enter</kbd></p>',
  },
  {
    name: "kbd with heading attrs",
    input: "## Shortcuts {.shortcuts}\n\nPress [[Ctrl]].",
    mdit: '<h2 class="shortcuts">Shortcuts</h2><p>Press <kbd>Ctrl</kbd>.</p>',
    remd: '<h2 class="shortcuts">Shortcuts</h2><p>Press <kbd>Ctrl</kbd>.</p>',
  },
  {
    name: "kbd and block attrs coexist",
    input: "Press [[Ctrl]] to copy text. {.tip}",
    mdit: '<p class="tip">Press <kbd>Ctrl</kbd> to copy text.</p>',
    remd: '<p class="tip">Press <kbd>Ctrl</kbd> to copy text.</p>',
  },
];

test.each(cases)("kbd + attrs (markdown-it): $name", ({ input, mdit: expected }) => {
  expect(normalizeHtml(md.render(input))).toBe(expected);
});

test.each(cases)("kbd + attrs (remark): $name", ({ input, remd: expected }) => {
  expect(remd(input)).toBe(expected);
});
