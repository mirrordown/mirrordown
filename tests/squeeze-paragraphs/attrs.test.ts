import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { squeezeParagraphs } from "../../packages/mdit-squeeze-paragraphs/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { rehypeSqueezeParagraphs } from "../../packages/remd-squeeze-paragraphs/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(attrs).use(squeezeParagraphs);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkAttrs)
        .use(remarkRehype)
        .use(rehypeSqueezeParagraphs)
        .use(rehypeStringify)
        .processSync(src)
    )
  );

describe("squeeze-paragraphs + attrs", () => {
  it("a paragraph carrying attrs has visible content and is kept", () => {
    const input = "Some text.\n{.note}";
    const expected = '<p class="note">Some text.</p>';
    expect(normalizeHtml(md.render(input))).toBe(expected);
    expect(remd(input)).toBe(expected);
  });
});
