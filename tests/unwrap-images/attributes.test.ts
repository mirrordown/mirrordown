import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { attrs } from "../../packages/mdit-attrs/src";
import { blockIds } from "../../packages/mdit-block-ids/src";
import { caption } from "../../packages/mdit-caption/src";
import { lightbox } from "../../packages/mdit-lightbox/src";
import { squeezeParagraphs } from "../../packages/mdit-squeeze-paragraphs/src";
import { unwrapImages } from "../../packages/mdit-unwrap-images/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { remarkBlockIds } from "../../packages/remd-block-ids/src";
import { remarkCaption } from "../../packages/remd-caption/src";
import { rehypeLightbox } from "../../packages/remd-lightbox/src";
import { rehypeSqueezeParagraphs } from "../../packages/remd-squeeze-paragraphs/src";
import { rehypeUnwrapImages } from "../../packages/remd-unwrap-images/src";
import { satteriBlockIds } from "../../packages/sat-block-ids/src";
import { satteriCaption } from "../../packages/sat-caption/src";
import { satteriLightbox } from "../../packages/sat-lightbox/src";
import { satteriSqueezeParagraphs } from "../../packages/sat-squeeze-paragraphs/src";
import { satteriUnwrapImages } from "../../packages/sat-unwrap-images/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cases = parseFixture(
  read("fixtures/attributes.md"),
  read("expected/attributes.html")
);

// The plugins that give a paragraph attributes (attrs and block-ids), the ones that build what an image paragraph sits in or beside (caption and lightbox), and squeeze-paragraphs after, in the presets' order and with GFM on, as the presets run them.
const md = new MarkdownIt()
  .use(attrs)
  .use(blockIds)
  .use(caption)
  .use(lightbox)
  .use(unwrapImages)
  .use(squeezeParagraphs);

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm, { singleTilde: false })
  .use(remarkAttrs)
  .use(remarkBlockIds)
  .use(remarkCaption)
  .use(remarkRehype)
  .use(rehypeLightbox)
  .use(rehypeUnwrapImages)
  .use(rehypeSqueezeParagraphs)
  .use(rehypeStringify);

const engines = [
  ["markdown-it", (input: string) => normalizeHtml(md.render(input))],
  [
    "remark",
    (input: string) => normalizeHtml(String(processor.processSync(input)))
  ],
  [
    "Sätteri",
    (input: string) =>
      normalizeHtml(
        markdownToHtml(input, {
          features: {
            gfm: true,
            attributes: true,
            frontmatter: false,
            smartPunctuation: false
          },
          mdastPlugins: [satteriBlockIds(), satteriCaption()],
          hastPlugins: [
            satteriLightbox(),
            satteriUnwrapImages(),
            satteriSqueezeParagraphs()
          ]
        }).html
      )
  ]
] as const;

// The paragraph's attributes go on its one image, so a link to its id still finds the image; a paragraph that has them and several images stays.
describe.each(engines)("unwrap-images with attributes (%s)", (_, render) => {
  it.each(cases)("$name", ({ input, expected }) => {
    expect(render(input)).toBe(expected);
  });
});
