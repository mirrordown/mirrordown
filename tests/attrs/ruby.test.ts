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

// Ruby and attributes both write in braces. A ruby needs a bar and never crosses another brace, so a group the attribute grammar reads (`{.a}`, `{#id}`, `{key=value}`) is not a ruby, and a ruby right after one is still a ruby, in every engine.
describe("attrs + ruby: a brace group both could claim", () => {
  it("a block followed by a ruby group stays two groups", () => {
    const input = "text {.a}{b|c}";
    const expected = "<p>text {.a}<ruby>b<rt>c</rt></ruby></p>";
    expect(mdit(input)).toBe(expected);
    expect(remd(input)).toBe(expected);
    expect(sat(input)).toBe(expected);
  });

  // An engine limit, not the intended behaviour: Sätteri reads attributes while parsing, before sat-ruby runs, so a group that ends a block and opens like a class is an attribute block there however it continues. The ruby guide documents it.
  it("a group that opens like a class and holds a bar, at the end of a block", () => {
    const input = "text {.a|b}";
    expect(mdit(input)).toBe("<p>text <ruby>.a<rt>b</rt></ruby></p>");
    expect(remd(input)).toBe("<p>text <ruby>.a<rt>b</rt></ruby></p>");
    expect(sat(input)).toBe('<p class="a|b">text</p>');
  });
});
