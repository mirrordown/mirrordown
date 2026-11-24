import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { attrs } from "../../packages/mdit-attrs/src";
import { imageSize } from "../../packages/mdit-image-size/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { remarkImageSize } from "../../packages/remd-image-size/src";
import { satteriImageSize } from "../../packages/sat-image-size/src";
import { normalizeHtml } from "../utils/index.js";

// Each engine with its attribute blocks, in both plugin orders where the engine has an order: markdown-it's two core rules and remark's two plugins. Sätteri reads attribute blocks while it parses, before any plugin.
const markdownIt = (sizeFirst: boolean) => {
  const md = sizeFirst
    ? new MarkdownIt().use(imageSize).use(attrs)
    : new MarkdownIt().use(attrs).use(imageSize);
  return (input: string): string => normalizeHtml(md.render(input));
};
const remark = (sizeFirst: boolean) => {
  const processor = unified()
    .use(remarkParse)
    .use(
      sizeFirst
        ? [remarkImageSize, remarkAttrs]
        : [remarkAttrs, remarkImageSize]
    )
    .use(remarkRehype)
    .use(rehypeStringify);
  return (input: string): string =>
    normalizeHtml(String(processor.processSync(input)));
};
const satteri = (input: string): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: { attributes: true, smartPunctuation: false },
      mdastPlugins: [satteriImageSize()]
    }).html
  );

const engines = [
  ["markdown-it, image-size first", markdownIt(true)],
  ["markdown-it, attrs first", markdownIt(false)],
  ["remark, image-size first", remark(true)],
  ["remark, attrs first", remark(false)],
  ["sätteri", satteri]
] as const;

const cases: [name: string, input: string, expected: string][] = [
  // What the author wrote by hand replaces what the description gave.
  [
    "a width in the block wins over the description's",
    "![a|100](u.jpg){width=50}",
    '<p><img src="u.jpg" alt="a" width="50"></p>'
  ],
  // Each attribute is replaced on its own: the block names only the width, so the description's height stays.
  [
    "a width in the block leaves the description's height",
    "![a|100x145](u.jpg){width=50}",
    '<p><img src="u.jpg" alt="a" width="50" height="145"></p>'
  ],
  [
    "a height in the block leaves the description's width",
    "![a|100x145](u.jpg){height=20}",
    '<p><img src="u.jpg" alt="a" width="100" height="20"></p>'
  ],
  [
    "a height in the block joins a description that gives only a width",
    "![a|100](u.jpg){height=20}",
    '<p><img src="u.jpg" alt="a" width="100" height="20"></p>'
  ],
  // The size goes right after the image's own attributes, the rest of the block after it, whichever plugin ran first.
  [
    "a class and an id from the block follow the size",
    "![a|100](u.jpg){.wide #portrait}",
    '<p><img src="u.jpg" alt="a" width="100" class="wide" id="portrait"></p>'
  ],
  [
    "the size follows the title and comes before the block",
    '![a|100x145](u.jpg "T"){.wide}',
    '<p><img src="u.jpg" alt="a" title="T" width="100" height="145" class="wide"></p>'
  ],
  [
    "a block on an image without a size is left as it is",
    "![a](u.jpg){width=50 .wide}",
    '<p><img src="u.jpg" alt="a" width="50" class="wide"></p>'
  ],
  // The block is read after the image, not from its description: a size in an image with a block is still read.
  [
    "a block on a reference image",
    "![a|100][r]{.wide}\n\n[r]: u.jpg",
    '<p><img src="u.jpg" alt="a" width="100" class="wide"></p>'
  ]
];

describe.each(engines)("image-size + attrs (%s)", (_engine, render) => {
  it.each(cases)("%s", (_name, input, expected) => {
    expect(render(input)).toBe(expected);
  });
});

// A `title` written in a block is an attribute like the others in remark and Sätteri, which keep the image's own title on the node, so it follows the size. markdown-it keeps every attribute in one list, and once attrs has run a block's `title` is where the image's own would be: the plugin can't tell them apart.
describe("image-size + attrs: a title written in the block", () => {
  const input = "![a|100](u.jpg){title=x .wide}";
  const expected =
    '<p><img src="u.jpg" alt="a" width="100" title="x" class="wide"></p>';

  it.each(engines.filter(([engine]) => engine !== "markdown-it, attrs first"))(
    "follows the size (%s)",
    (_engine, render) => {
      expect(render(input)).toBe(expected);
    }
  );

  it("comes before the size in markdown-it with attrs added first, so the preset adds image-size first", () => {
    expect(markdownIt(false)(input)).toBe(
      '<p><img src="u.jpg" alt="a" title="x" width="100" class="wide"></p>'
    );
  });
});
