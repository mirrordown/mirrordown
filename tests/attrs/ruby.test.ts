import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { ruby } from "../../packages/mdit-ruby/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkRuby } from "../../packages/remd-ruby/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { satteriRuby } from "../../packages/sat-ruby/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(ruby).use(attrs);
const mdit = (src: string): string => normalizeHtml(md.render(src));
const remd = (src: string): string =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkRuby)
        .use(remarkAttrs)
        .use(remarkRehype)
        .use(rehypeStringify)
        .processSync(src)
    )
  );
const sat = (src: string): string =>
  normalizeHtml(
    markdownToHtml(src, {
      features: { attributes: true, smartPunctuation: false },
      mdastPlugins: [satteriRuby()]
    }).html
  );

// Ruby and attributes both write in braces, and the engines don't yet agree on who owns a group that could be either: ruby's rule runs first on markdown-it and remark, Sätteri reads attributes while parsing, before sat-ruby runs. This pins what each engine does today, so the rule the ruby set settles on changes it knowingly. It is not the intended behaviour.
describe("attrs + ruby: a brace group both could claim (unsettled)", () => {
  it("a group that opens like a class and holds a bar", () => {
    const input = "text {.a|b}";
    expect(mdit(input)).toBe("<p>text <ruby>.a<rt>b</rt></ruby></p>");
    expect(remd(input)).toBe("<p>text <ruby>.a<rt>b</rt></ruby></p>");
    expect(sat(input)).toBe('<p class="a|b">text</p>');
  });

  it("a block followed by a ruby group", () => {
    const input = "text {.a}{b|c}";
    expect(mdit(input)).toBe("<p>text <ruby>.a}{b<rt>c</rt></ruby></p>");
    expect(remd(input)).toBe("<p>text {.a}<ruby>b<rt>c</rt></ruby></p>");
    expect(sat(input)).toBe("<p>text {.a}<ruby>b<rt>c</rt></ruby></p>");
  });
});
