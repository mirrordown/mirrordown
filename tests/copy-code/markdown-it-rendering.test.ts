import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import {
  copyCode,
  type CopyCodeOptions
} from "../../packages/mdit-copy-code/src";
import { rehypeCopyCode } from "../../packages/remd-copy-code/src";
import { normalizeHtml } from "../utils/index.js";

const input = "```sh\nnpm test\n```";
const button = (html: string): string =>
  /<button[^]*<\/button>/.exec(html)?.[0] ?? ``;

const remark = (options: CopyCodeOptions): string =>
  String(
    unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeCopyCode, options)
      .use(rehypeStringify, { allowDangerousHtml: true })
      .processSync(input)
  );

// markdown-it puts the button into the HTML another rule rendered, where the other engines add a node to a tree. Text from the options goes in as written: a price, a shell variable or a regex in a label is not a pattern for the replace that inserts it.
describe("mdit-copy-code: option text with dollar signs is written as it is", () => {
  it.each([`Copy $& all`, `Costs $$5`, `Copy $' and $\``, `Copy $1`])(
    "%s",
    (copy) => {
      const options = { text: { copy } };
      const html = new MarkdownIt().use(copyCode, options).render(input);
      // In the attribute an ampersand is escaped, and nothing else here is.
      expect(button(html)).toContain(
        `aria-label="${copy.replace(/&/g, `&amp;`)}"`
      );
      expect(normalizeHtml(html)).toBe(normalizeHtml(remark(options)));
    }
  );
});

// The ids a document's blocks get are kept on the `env` it was parsed with. A host that parses and renders in two steps may hand the renderer a different one.
describe("mdit-copy-code: rendering tokens with an env the parser did not see", () => {
  const md = new MarkdownIt().use(copyCode);
  const source = "```\nx\n```\n\n```\nx\n```";

  it("still gives every block its button, with the ids a single render gives", () => {
    const split = md.renderer.render(md.parse(source, {}), md.options, {});
    expect(split.match(/<button/g)).toHaveLength(2);
    expect(split).toBe(md.render(source));
  });
});
