import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified, type PluggableList } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { abbr } from "../../packages/mdit-abbr/src";
import { autolinkHeadings } from "../../packages/mdit-autolink-headings/src";
import { del } from "../../packages/mdit-del/src";
import { kbd } from "../../packages/mdit-kbd/src";
import { mark } from "../../packages/mdit-mark/src";
import { slug } from "../../packages/mdit-slug/src";
import { tags } from "../../packages/mdit-tags/src";
import { remarkAbbr } from "../../packages/remd-abbr/src";
import { rehypeAutolinkHeadings } from "../../packages/remd-autolink-headings/src";
import { remarkDel } from "../../packages/remd-del/src";
import { remarkKbd } from "../../packages/remd-kbd/src";
import { remarkMark } from "../../packages/remd-mark/src";
import { rehypeSlug } from "../../packages/remd-slug/src";
import { remarkTags } from "../../packages/remd-tags/src";
import { satteriAbbr } from "../../packages/sat-abbr/src";
import { satteriAutolinkHeadings } from "../../packages/sat-autolink-headings/src";
import { satteriDel } from "../../packages/sat-del/src";
import { satteriKbd } from "../../packages/sat-kbd/src";
import { satteriMark } from "../../packages/sat-mark/src";
import { satteriSlug } from "../../packages/sat-slug/src";
import { satteriTags } from "../../packages/sat-tags/src";
import { normalizeHtml } from "../utils/index.js";

// The sets whose output shares text with a tag, composed as each engine needs them.

type Render = (input: string) => string;

const mdit =
  (md: MarkdownIt): Render =>
  (input) =>
    normalizeHtml(md.render(input));

const remark = (
  remarkPlugins: PluggableList,
  rehypePlugins: PluggableList = []
): Render => {
  const processor = unified()
    .use(remarkParse)
    .use(remarkPlugins)
    .use(remarkRehype)
    .use(rehypePlugins)
    .use(rehypeStringify);
  return (input) => normalizeHtml(String(processor.processSync(input)));
};

const satteri =
  (options: Omit<Parameters<typeof markdownToHtml>[1], `features`>): Render =>
  (input) =>
    normalizeHtml(
      markdownToHtml(input, {
        features: { gfm: false, frontmatter: false, smartPunctuation: false },
        ...options
      }).html
    );

// A highlight or a deletion is an element like emphasis: a tag can open its content, and a `#` straight after it is text. In remark and Sätteri the span plugins build those elements after parsing, so the tags plugin is listed after them.
describe("tags + mark and del", () => {
  const engines = [
    [`markdown-it`, mdit(new MarkdownIt().use(del).use(mark).use(tags))],
    [`remark`, remark([remarkDel, remarkMark, remarkTags])],
    [
      `sätteri`,
      satteri({ mdastPlugins: [satteriDel(), satteriMark(), satteriTags()] })
    ]
  ] as const;

  const cases: [name: string, input: string, expected: string][] = [
    [
      `a tag opens a span's content`,
      `==#tag== --#gone--`,
      `<p><mark><a class="tag" href="#tag">#tag</a></mark> <del><a class="tag" href="#gone">#gone</a></del></p>`
    ],
    [
      `a tag after a space inside a span`,
      `==see #tag== --old #gone--`,
      `<p><mark>see <a class="tag" href="#tag">#tag</a></mark> <del>old <a class="tag" href="#gone">#gone</a></del></p>`
    ],
    [
      `a hash straight after a span is text`,
      `==x==#tag --x--#gone`,
      `<p><mark>x</mark>#tag <del>x</del>#gone</p>`
    ],
    [
      `a span's delimiter ends a tag`,
      `#a==b== #c--d--`,
      `<p><a class="tag" href="#a">#a</a><mark>b</mark> <a class="tag" href="#c">#c</a><del>d</del></p>`
    ],
    [
      `an escaped delimiter after a tag stays text`,
      `#a\\==b== #c\\--d--`,
      `<p><a class="tag" href="#a">#a</a>==b== <a class="tag" href="#c">#c</a>--d--</p>`
    ]
  ];

  describe.each(engines)("%s", (_engine, render) => {
    it.each(cases)("%s", (_name, input, expected) => {
      expect(render(input)).toBe(expected);
    });
  });

  // Listed before the span plugins, the tags plugin sees `==#tag==` as text, where the `#` follows a `=`, and the highlight built afterwards holds no tag. markdown-it's spans are parsed before any core rule, whatever the order.
  it("remark: listed before the span plugins, a span's opening tag is text", () => {
    expect(remark([remarkTags, remarkMark])(`==#tag==`)).toBe(
      `<p><mark>#tag</mark></p>`
    );
  });

  it("sätteri: listed before the span plugins, a span's opening tag is text", () => {
    expect(
      satteri({ mdastPlugins: [satteriTags(), satteriMark()] })(`==#tag==`)
    ).toBe(`<p><mark>#tag</mark></p>`);
  });

  it("markdown-it: the order the plugins are added in doesn't matter", () => {
    expect(mdit(new MarkdownIt().use(tags).use(mark))(`==#tag==`)).toBe(
      `<p><mark><a class="tag" href="#tag">#tag</a></mark></p>`
    );
  });
});

// A key is an element too. `[[#]]` is a key holding a lone `#`, which is no tag; a key holding a tag holds its link.
describe("tags + kbd", () => {
  const engines = [
    [`markdown-it`, mdit(new MarkdownIt().use(kbd).use(tags))],
    [`remark`, remark([remarkKbd, remarkTags])],
    [`sätteri`, satteri({ mdastPlugins: [satteriKbd(), satteriTags()] })]
  ] as const;

  const cases: [name: string, input: string, expected: string][] = [
    [`a key of a lone hash`, `Press [[#]]`, `<p>Press <kbd>#</kbd></p>`],
    [
      `a tag after a key and a space`,
      `[[Ctrl]] #tag`,
      `<p><kbd>Ctrl</kbd> <a class="tag" href="#tag">#tag</a></p>`
    ],
    [
      `a hash straight after a key is text`,
      `[[Ctrl]]#tag`,
      `<p><kbd>Ctrl</kbd>#tag</p>`
    ],
    [
      `a tag opens a key's content`,
      `[[#tag]]`,
      `<p><kbd><a class="tag" href="#tag">#tag</a></kbd></p>`
    ]
  ];

  describe.each(engines)("%s", (_engine, render) => {
    it.each(cases)("%s", (_name, input, expected) => {
      expect(render(input)).toBe(expected);
    });
  });

  it("remark: listed before the kbd plugin, a key's opening tag is text", () => {
    expect(remark([remarkTags, remarkKbd])(`[[#tag]]`)).toBe(
      `<p><kbd>#tag</kbd></p>`
    );
  });
});

// A heading's id comes from its text, and a tag's text, `#` included, is part of it; github-slugger drops the `#` and the `/`. All three engines slug the same text.
describe("tags + slug and autolink-headings", () => {
  const engines = [
    [
      `markdown-it`,
      mdit(new MarkdownIt().use(tags).use(slug).use(autolinkHeadings))
    ],
    [`remark`, remark([remarkTags], [rehypeSlug, rehypeAutolinkHeadings])],
    [
      `sätteri`,
      satteri({
        mdastPlugins: [satteriTags()],
        hastPlugins: [satteriSlug(), satteriAutolinkHeadings()]
      })
    ]
  ] as const;

  const anchor = (id: string): string =>
    `<a class="anchor" aria-hidden="true" tabindex="-1" href="#${id}"></a>`;

  const cases: [name: string, input: string, expected: string][] = [
    [
      `a tag ending a heading`,
      `# heading #tagged`,
      `<h1 id="heading-tagged">${anchor(`heading-tagged`)}heading <a class="tag" href="#tagged">#tagged</a></h1>`
    ],
    [
      `a tag starting a heading`,
      `## #Tag two`,
      `<h2 id="tag-two">${anchor(`tag-two`)}<a class="tag" href="#Tag">#Tag</a> two</h2>`
    ],
    [
      `tags outside ASCII and with a slash`,
      `# #日本語 #a/b`,
      `<h1 id="日本語-ab">${anchor(`日本語-ab`)}<a class="tag" href="#日本語">#日本語</a> <a class="tag" href="#a/b">#a/b</a></h1>`
    ]
  ];

  describe.each(engines)("%s", (_engine, render) => {
    it.each(cases)("%s", (_name, input, expected) => {
      expect(render(input)).toBe(expected);
    });
  });
});

// The abbr plugins mark a defined term in any text, a link's included, and a term inside a tag's name is no exception. What a reader gets depends on which plugin goes first, the same way in every engine. Tags first (markdown-it: `use(abbr)` before `use(tags)`, since a core rule added later runs earlier; remark and Sätteri: the tags plugin listed first) keeps every tag and marks the term inside its link. Abbr first splits the text at the term, so a tag whose name is the term, or ends with it, loses it. The presets take the first order; this pins both, so a change to either is a deliberate one.
describe("tags + abbr", () => {
  const input = `*[HTML]: Hyper Text\n\n#HTML #HTMLx #a/HTML and HTML`;
  const term = `<abbr title="Hyper Text">HTML</abbr>`;

  describe("tags first: the term is marked inside the tag's link", () => {
    const expected = `<p><a class="tag" href="#HTML">#${term}</a> <a class="tag" href="#HTMLx">#HTMLx</a> <a class="tag" href="#a/HTML">#a/${term}</a> and ${term}</p>`;

    it.each([
      [`markdown-it`, mdit(new MarkdownIt().use(abbr).use(tags))],
      [`remark`, remark([remarkTags, remarkAbbr])],
      [`sätteri`, satteri({ mdastPlugins: [satteriTags(), satteriAbbr()] })]
    ] as const)("%s", (_engine, render) => {
      expect(render(input)).toBe(expected);
    });
  });

  describe("abbr first: the term splits the tag", () => {
    const expected = `<p>#${term} <a class="tag" href="#HTMLx">#HTMLx</a> <a class="tag" href="#a/">#a/</a>${term} and ${term}</p>`;

    it.each([
      [`markdown-it`, mdit(new MarkdownIt().use(tags).use(abbr))],
      [`remark`, remark([remarkAbbr, remarkTags])],
      [`sätteri`, satteri({ mdastPlugins: [satteriAbbr(), satteriTags()] })]
    ] as const)("%s", (_engine, render) => {
      expect(render(input)).toBe(expected);
    });
  });
});
