import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { sup } from "../../packages/mdit-sup/src";
import { mark } from "../../packages/mdit-mark/src";
import { remarkSup } from "../../packages/remd-sup/src";
import { remarkMark } from "../../packages/remd-mark/src";
import { satteriMark } from "../../packages/sat-mark/src";
import { normalizeHtml } from "../utils/index.js";

const mdit = (input: string): string =>
  normalizeHtml(new MarkdownIt().use(sup).use(mark).render(input));

const remd = (input: string): string =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkSup)
        .use(remarkMark)
        .use(remarkRehype)
        .use(rehypeStringify)
        .processSync(input)
    )
  );

const sat = (input: string): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: {
        gfm: false,
        superscript: true,
        frontmatter: false,
        smartPunctuation: false
      },
      mdastPlugins: [satteriMark()]
    }).html
  );

const engines = [
  ["markdown-it", mdit],
  ["remark", remd],
  ["sätteri", sat]
] as const;

describe("sup + mark", () => {
  describe.each(engines)("%s", (_, render) => {
    it("nests a superscript in a mark and a mark in a superscript", () => {
      expect(render("==^a^== ^==b==^")).toBe(
        "<p><mark><sup>a</sup></mark> <sup><mark>b</mark></sup></p>"
      );
    });
  });

  // Crossing spans are malformed, and each engine resolves them its own way. In remark and Sätteri the superscript is already a node when the `==` runs are paired, so runs on either side of its boundary never pair and the superscript wins; markdown-it pairs every delimiter in one pass and closes whichever closer comes first. The same holds for ins, del and spoiler, which pair the way mark does. Pinned so that a change in any engine is noticed.
  describe("a mark that starts outside a superscript and ends inside it", () => {
    const input = "==a ^b== c^";

    it("markdown-it: the mark closes first and the superscript is lost", () => {
      expect(mdit(input)).toBe("<p><mark>a ^b</mark> c^</p>");
    });

    it.each(engines.slice(1))(
      "%s: the superscript wins and the mark is lost",
      (_, render) => {
        expect(render(input)).toBe("<p>==a <sup>b== c</sup></p>");
      }
    );
  });
});
