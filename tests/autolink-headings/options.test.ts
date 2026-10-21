import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import type { Element } from "hast";
import { rehypeSlug } from "../../packages/remd-slug/src";
import {
  rehypeAutolinkHeadings,
  type AutolinkHeadingsOptions
} from "../../packages/remd-autolink-headings/src";
import { satteriSlug } from "../../packages/sat-slug/src";
import {
  satteriAutolinkHeadings,
  type AutolinkHeadingsOptions as SatOptions
} from "../../packages/sat-autolink-headings/src";
import { normalizeHtml } from "../utils/index.js";

// These options carry hast nodes / callbacks, which have no markdown-it equivalent; the two hast engines (rehype and Sätteri) both take them, so each case runs through both and they must agree.
const runRemd = (input: string, options: AutolinkHeadingsOptions) =>
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

const runSat = (input: string, options: SatOptions) =>
  normalizeHtml(
    markdownToHtml(input, {
      features: { frontmatter: false, smartPunctuation: false },
      hastPlugins: [satteriSlug(), satteriAutolinkHeadings(options)]
    }).html
  );

describe.each([
  ["rehype", runRemd],
  ["sätteri", runSat]
] as const)("autolink-headings hast options (%s)", (_, run) => {
  it("content places a given hast node inside the link", () => {
    const icon: Element = {
      type: "element",
      tagName: "span",
      properties: { className: ["icon"] },
      children: []
    };
    expect(run("## Title", { content: icon })).toBe(
      '<h2 id="title"><a class="anchor" aria-hidden="true" tabindex="-1" href="#title"><span class="icon"></span></a>Title</h2>'
    );
  });

  it("content as a function is called with the heading element", () => {
    expect(
      run("## Title", {
        // Typed for both engines' heading elements, since `run` is either runner.
        content: (element: { properties: { id?: unknown } }) => ({
          type: "text" as const,
          value: `#${String(element.properties.id)}`
        })
      })
    ).toBe(
      '<h2 id="title"><a class="anchor" aria-hidden="true" tabindex="-1" href="#title">#title</a>Title</h2>'
    );
  });

  it("properties fully replaces the default link properties", () => {
    expect(run("## Title", { properties: { className: ["permalink"] } })).toBe(
      '<h2 id="title"><a class="permalink" href="#title"></a>Title</h2>'
    );
  });

  it("headingProperties are merged onto the heading element", () => {
    expect(
      run("## Title", { headingProperties: { className: ["has-anchor"] } })
    ).toBe(
      '<h2 id="title" class="has-anchor"><a class="anchor" aria-hidden="true" tabindex="-1" href="#title"></a>Title</h2>'
    );
  });

  it("group wraps the heading and link for before/after behaviors", () => {
    const group: Element = {
      type: "element",
      tagName: "div",
      properties: { className: ["heading-group"] },
      children: []
    };
    expect(run("## Title", { behavior: "after", group })).toBe(
      '<div class="heading-group"><h2 id="title">Title</h2><a class="anchor" href="#title"></a></div>'
    );
  });

  it("test limits which headings are linked", () => {
    expect(run("# One\n\n## Two", { test: "h2" })).toBe(
      '<h1 id="one">One</h1><h2 id="two"><a class="anchor" aria-hidden="true" tabindex="-1" href="#two"></a>Two</h2>'
    );
  });
});
