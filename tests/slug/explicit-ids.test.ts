import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { slug, type SlugOptions } from "../../packages/mdit-slug/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { rehypeSlug } from "../../packages/remd-slug/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { satteriSlug } from "../../packages/sat-slug/src";
import { normalizeHtml } from "../utils/index.js";

// An id is only an anchor if it is the one element with that id. The slugger keeps its generated ids apart from each other, but an id written by hand (`{#b}`) comes from the attrs plugin, and the slugger has to be told about it or it will hand the same id to a heading whose text slugs to it.

const engines = (options?: SlugOptions) =>
  [
    [
      "markdown-it",
      (input: string) =>
        normalizeHtml(
          new MarkdownIt().use(attrs).use(slug, options).render(input)
        )
    ],
    [
      "remark",
      (input: string) =>
        normalizeHtml(
          String(
            unified()
              .use(remarkParse)
              .use(remarkAttrs)
              .use(remarkRehype)
              .use(rehypeSlug, options)
              .use(rehypeStringify)
              .processSync(input)
          )
        )
    ],
    [
      "sätteri",
      (input: string) =>
        normalizeHtml(
          markdownToHtml(input, {
            features: {
              gfm: false,
              frontmatter: false,
              smartPunctuation: false,
              attributes: true
            },
            hastPlugins: [satteriSlug(options)]
          }).html
        )
    ]
  ] as const;

const cases: [name: string, input: string, expected: string][] = [
  [
    "a later heading does not repeat an id written by hand",
    "## B {#b}\n\n## B",
    '<h2 id="b">B</h2><h2 id="b-1">B</h2>'
  ],
  [
    "an earlier heading does not take an id written by hand further down",
    "## B\n\n## Other {#b}",
    '<h2 id="b-1">B</h2><h2 id="b">Other</h2>'
  ],
  [
    "a suffixed id written by hand is skipped over when counting duplicates",
    "## X {#b-1}\n\n## B\n\n## B",
    '<h2 id="b-1">X</h2><h2 id="b">B</h2><h2 id="b-2">B</h2>'
  ],
  [
    "an empty id is no id, so the heading is slugged",
    '## E {id=""}',
    '<h2 id="e">E</h2>'
  ]
];

describe.each(engines())(
  "slug beside ids written by hand (%s)",
  (_e, render) => {
    it.each(cases)("%s", (_name, input, expected) => {
      expect(render(input)).toBe(expected);
    });
  }
);

describe.each(engines({ prefix: "doc-" }))(
  "slug with a prefix beside ids written by hand (%s)",
  (_engine, render) => {
    it("keeps a prefixed generated id apart from the same id written by hand", () => {
      expect(render("## B {#doc-b}\n\n## B")).toBe(
        '<h2 id="doc-b">B</h2><h2 id="doc-b-1">B</h2>'
      );
    });

    it("leaves generated ids alone when a hand-written id lacks the prefix", () => {
      expect(render("## B {#b}\n\n## B")).toBe(
        '<h2 id="b">B</h2><h2 id="doc-b">B</h2>'
      );
    });
  }
);
