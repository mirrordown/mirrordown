import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import type { Element } from "hast";
import { rehypeSlug } from "../../packages/remd-slug/src";
import {
  rehypeAutolinkHeadings,
  type AutolinkHeadingsOptions
} from "../../packages/remd-autolink-headings/src";
import { normalizeHtml } from "../utils/index.js";

// These options carry hast nodes / callbacks, which have no markdown-it
// equivalent — they are part of the remd-only surface (see the guide's parity
// note), so they are exercised against rehype alone rather than as shared
// fixtures.
const run = (input: string, options: AutolinkHeadingsOptions) =>
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

describe("autolink-headings remd-only options", () => {
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
        content: (element) => ({
          type: "text",
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
