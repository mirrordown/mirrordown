import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified, type PluggableList } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { tags } from "../../packages/mdit-tags/src";
import { remarkTags } from "../../packages/remd-tags/src";
import { satteriTags } from "../../packages/sat-tags/src";
import { normalizeHtml } from "../utils/index.js";

// Tags are read after attribute blocks: markdown-it's attrs rule runs before `linkify` and the tags rule after it, remark lists `remarkAttrs` first, and Sätteri reads blocks in its parser, before any plugin. So `{#intro}` is an id and never a tag, and a tag is plain text as far as a block goes: `#tag{.x}` is handled as `word{.x}` is.

const remark = (plugins: PluggableList) => {
  const processor = unified()
    .use(remarkParse)
    .use(plugins)
    .use(remarkRehype)
    .use(rehypeStringify);
  return (input: string): string =>
    normalizeHtml(String(processor.processSync(input)));
};

const satteri =
  (attributes: boolean) =>
  (input: string): string =>
    normalizeHtml(
      markdownToHtml(input, {
        features: {
          attributes,
          gfm: false,
          frontmatter: false,
          smartPunctuation: false
        },
        mdastPlugins: [satteriTags()]
      }).html
    );

const mdit =
  (md: MarkdownIt) =>
  (input: string): string =>
    normalizeHtml(md.render(input));

describe("tags + attrs: a block is read before the tags in it", () => {
  const engines = [
    [`markdown-it`, mdit(new MarkdownIt().use(attrs).use(tags))],
    [`remark`, remark([remarkAttrs, remarkTags])],
    [`sätteri`, satteri(true)]
  ] as const;

  const cases: [name: string, input: string, expected: string][] = [
    [
      `an id in a paragraph's block is an id`,
      `Para {.wide #intro}`,
      `<p class="wide" id="intro">Para</p>`
    ],
    [
      `an id in a heading's block is an id`,
      `## Heading {#intro .x}`,
      `<h2 id="intro" class="x">Heading</h2>`
    ],
    [
      `a block ending a paragraph after a tag goes on the paragraph, as after a word`,
      `#tag{.x}\n\nword{.x}`,
      `<p class="x"><a class="tag" href="#tag">#tag</a></p><p class="x">word</p>`
    ],
    [
      `a block in the middle of the text after a tag stays text, as after a word`,
      `a #tag{.x} b\n\na word{.x} b`,
      `<p>a <a class="tag" href="#tag">#tag</a>{.x} b</p><p>a word{.x} b</p>`
    ],
    [
      `a block after a tag and a space goes on the paragraph`,
      `#tag {.x}`,
      `<p class="x"><a class="tag" href="#tag">#tag</a></p>`
    ]
  ];

  describe.each(engines)("%s", (_engine, render) => {
    it.each(cases)("%s", (_name, input, expected) => {
      expect(render(input)).toBe(expected);
    });
  });
});

// Without attributes a block is ordinary text, and a `#` after a space in it opens a tag like anywhere else.
describe("tags without attrs: a block is text", () => {
  const engines = [
    [`markdown-it`, mdit(new MarkdownIt().use(tags))],
    [`remark`, remark([remarkTags])],
    [`sätteri`, satteri(false)]
  ] as const;

  describe.each(engines)("%s", (_engine, render) => {
    it("reads a tag inside the braces", () => {
      expect(render(`Para {.wide #intro}`)).toBe(
        `<p>Para {.wide <a class="tag" href="#intro">#intro</a>}</p>`
      );
    });

    it("ends a tag at the brace", () => {
      expect(render(`#tag{.x}`)).toBe(
        `<p><a class="tag" href="#tag">#tag</a>{.x}</p>`
      );
    });
  });
});

// The order is the remark user's to get right: listed before `remarkAttrs`, the tags plugin takes the `#intro` of a block first, and attrs no longer finds the block. markdown-it's rules have fixed places whatever order the plugins are added in.
describe("tags + attrs: the plugin order", () => {
  it("remark: listed before remarkAttrs, a tag breaks the block", () => {
    expect(remark([remarkTags, remarkAttrs])(`Para {.wide #intro}`)).toBe(
      `<p>Para {.wide <a class="tag" href="#intro">#intro</a>}</p>`
    );
  });

  it("markdown-it: the order the plugins are added in doesn't matter", () => {
    expect(
      mdit(new MarkdownIt().use(tags).use(attrs))(`Para {.wide #intro}`)
    ).toBe(`<p class="wide" id="intro">Para</p>`);
  });
});
