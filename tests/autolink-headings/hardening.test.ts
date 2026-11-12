import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { attrs } from "../../packages/mdit-attrs/src";
import { slug } from "../../packages/mdit-slug/src";
import { autolinkHeadings } from "../../packages/mdit-autolink-headings/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { rehypeSlug } from "../../packages/remd-slug/src";
import { rehypeAutolinkHeadings } from "../../packages/remd-autolink-headings/src";
import { satteriSlug } from "../../packages/sat-slug/src";
import { satteriAutolinkHeadings } from "../../packages/sat-autolink-headings/src";
import { normalizeHtml } from "../utils/index.js";

const mdit = (input: string, options?: object): string =>
  normalizeHtml(
    new MarkdownIt()
      .use(attrs)
      .use(slug)
      .use(autolinkHeadings, options)
      .render(input)
  );

const remd = (input: string, options?: object): string =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkAttrs)
        .use(remarkRehype)
        .use(rehypeSlug)
        .use(rehypeAutolinkHeadings, options)
        .use(rehypeStringify)
        .processSync(input)
    )
  );

const sat = (input: string, options?: object): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: {
        frontmatter: false,
        smartPunctuation: false,
        attributes: true
      },
      hastPlugins: [satteriSlug(), satteriAutolinkHeadings(options)]
    }).html
  );

const engines = [
  ["markdown-it", mdit],
  ["remark", remd],
  ["sätteri", sat]
] as const;

// The id in the link comes from the document: with attrs, an author can give a heading any id. markdown-it writes its link as a string, so a quote in the id used to end the `href` and start a new attribute.
describe.each(engines)(
  "autolink-headings: an id is one attribute value, whatever it holds (%s)",
  (_engine, render) => {
    it.each([
      [`a quote`, `## T {id='a"b'}`, `#a&quot;b`],
      [`an ampersand`, `## T {id="a&b"}`, `#a&amp;b`]
    ])("%s", (_name, input, href) => {
      const html = render(input);
      expect(html).toContain(`href="${href}"`);
      // One link, with the attributes the plugin gives it and no others.
      expect(html.match(/<a [^>]*>/g)).toEqual([
        `<a class="anchor" aria-hidden="true" tabindex="-1" href="${href}">`
      ]);
    });
  }
);

// `behavior` picks one of five ways to place the link. A value that is none of them used to mean something different in each engine, and none of those was what was asked for.
describe.each(engines)(
  "autolink-headings: behavior is one of the five (%s)",
  (_engine, render) => {
    it.each([`bogus`, `WRAP`, ``])("rejects %j", (behavior) => {
      expect(() => render(`## Title`, { behavior })).toThrow(
        /unknown behavior/
      );
    });

    it("reads null as the default, prepend", () => {
      expect(render(`## Title`, { behavior: null })).toBe(
        render(`## Title`, {})
      );
    });
  }
);

// Sätteri's visitor holds a copy of the heading, so properties it had just set were not there when it built the link.
describe("autolink-headings: headingProperties are on the heading the link is built from", () => {
  const options = { headingProperties: { id: `other` } };
  const expected = `<h2 id="other"><a class="anchor" aria-hidden="true" tabindex="-1" href="#other"></a>T</h2>`;

  it("remark points the link at the id it set", () => {
    expect(remd(`## T`, options)).toBe(expected);
  });

  it("sätteri does too", () => {
    expect(sat(`## T`, options)).toBe(expected);
  });
});
