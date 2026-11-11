import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { mirrordown as markdownItPreset } from "../../packages/preset-markdown-it/src";
import { mirrordown as remarkPreset } from "../../packages/preset-remark/src";
import { mirrordown as satteriPreset } from "../../packages/preset-satteri/src";
import { normalizeHtml } from "../utils/index.js";

const remark = remarkPreset();
const engines = [
  {
    engine: `markdown-it`,
    render: (input: string) =>
      new MarkdownIt().use(markdownItPreset).render(input)
  },
  {
    engine: `remark`,
    render: (input: string) =>
      String(
        unified()
          .use(remarkParse)
          .use(remark.remarkPlugins)
          .use(remarkRehype, remark.remarkRehype)
          .use(remark.rehypePlugins)
          .use(rehypeStringify, { allowDangerousHtml: true })
          .processSync(input)
      )
  },
  {
    engine: `sätteri`,
    render: (input: string) => markdownToHtml(input, satteriPreset()).html
  }
];

// A label's markup, with each icon's `<svg>` shortened.
const labels = (html: string): string[] =>
  [
    ...normalizeHtml(html).matchAll(
      /<label class="markdown-tabs-label"[^>]*>(.*?)<\/label>(?=<input|<\/div>)/g
    )
  ].map(([, label = ``]) => label.replace(/<svg\b.*?<\/svg>/g, `<svg/>`));

// The other inline plugins write the label's markup before tab-icons reads it, so the marker has to come out of what they left, without their text being written a second time, and a marker they took a piece of has to stay whole.
const cases: [string, string, string][] = [
  [
    `a key after the marker is written once`,
    `% [!npm] [[Ctrl]]\n> Body.`,
    `<svg/><kbd>Ctrl</kbd>`
  ],
  [
    `marked and superscript text after the marker is written once`,
    `% [!npm] ==Install== x^2^\n> Body.`,
    `<svg/><mark>Install</mark> x<sup>2</sup>`
  ],
  [
    `a marker whose keyword became an abbreviation stays as written`,
    `*[npm]: Node Package Manager\n\n% [!npm] Install\n> Body.`,
    `<svg/>[!<abbr title="Node Package Manager">npm</abbr>] Install`
  ]
];

describe.each(cases)(
  `tab-icons with the presets' inline plugins: %s`,
  (_, input, label) => {
    it.each(engines)(`$engine`, ({ render }) => {
      expect(labels(render(input))).toEqual([label]);
    });
  }
);

describe(`tab-icons with the presets' inline plugins: a spoiler after the marker is written once`, () => {
  it.each(engines)(`$engine`, ({ render }) => {
    const [label = ``] = labels(render(`% [!npm] ||Install||\n> Body.`));
    expect(label.startsWith(`<svg/><label class="markdown-spoiler"`)).toBe(
      true
    );
    expect(label.split(`Install`)).toHaveLength(2);
  });
});
