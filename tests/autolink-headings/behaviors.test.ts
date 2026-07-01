import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { slug } from "../../packages/mdit-slug/src";
import {
  autolinkHeadings,
  type AutolinkHeadingsOptions
} from "../../packages/mdit-autolink-headings/src";
import { rehypeSlug } from "../../packages/remd-slug/src";
import {
  rehypeAutolinkHeadings,
  type AutolinkHeadingsOptions as RemdOptions
} from "../../packages/remd-autolink-headings/src";
import { normalizeHtml } from "../utils/index.js";

type Behavior = AutolinkHeadingsOptions["behavior"];

const renderMdit = (input: string, options: AutolinkHeadingsOptions) =>
  normalizeHtml(
    new MarkdownIt().use(slug).use(autolinkHeadings, options).render(input)
  );

const renderRemd = (input: string, options: RemdOptions) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(rehypeSlug)
        .use(rehypeAutolinkHeadings, options)
        .use(rehypeStringify)
        .processSync(input)
    )
  );

// Each behavior must produce the documented HTML AND be identical across engines.
const behaviorCases: {
  name: string;
  behavior: Behavior;
  expected: string;
}[] = [
  {
    name: "append places the link after the heading content",
    behavior: "append",
    expected:
      '<h2 id="title">Title<a class="anchor" aria-hidden="true" tabindex="-1" href="#title"></a></h2>'
  },
  {
    name: "wrap wraps the heading content in the link",
    behavior: "wrap",
    expected: '<h2 id="title"><a class="anchor" href="#title">Title</a></h2>'
  },
  {
    name: "before inserts the link as a sibling before the heading",
    behavior: "before",
    expected: '<a class="anchor" href="#title"></a><h2 id="title">Title</h2>'
  },
  {
    name: "after inserts the link as a sibling after the heading",
    behavior: "after",
    expected: '<h2 id="title">Title</h2><a class="anchor" href="#title"></a>'
  }
];

describe("autolink-headings behaviors", () => {
  it.each(behaviorCases)("$name", ({ behavior, expected }) => {
    expect(renderMdit("## Title", { behavior })).toBe(expected);
    expect(renderRemd("## Title", { behavior })).toBe(expected);
  });

  // The mdit `class` option is a narrow override (it swaps the class but keeps
  // the inject defaults), whereas remd's `properties` replaces the whole set —
  // they are intentionally different-shaped options, so each is checked alone.
  it("the markdown-it class option swaps the class, keeping inject defaults", () => {
    expect(renderMdit("## Title", { class: "permalink" })).toBe(
      '<h2 id="title"><a class="permalink" aria-hidden="true" tabindex="-1" href="#title"></a>Title</h2>'
    );
  });
});

describe("autolink-headings: no id means no link", () => {
  // Without slug (or attrs) a heading has no id, so autolink must skip it.
  const input = "## Title";
  const expected = "<h2>Title</h2>";

  it("markdown-it", () => {
    expect(
      normalizeHtml(new MarkdownIt().use(autolinkHeadings).render(input))
    ).toBe(expected);
  });

  it("remark", () => {
    expect(
      normalizeHtml(
        String(
          unified()
            .use(remarkParse)
            .use(remarkRehype)
            .use(rehypeAutolinkHeadings)
            .use(rehypeStringify)
            .processSync(input)
        )
      )
    ).toBe(expected);
  });
});
