import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { blockIds } from "../../packages/mdit-block-ids/src";
import { remarkBlockIds } from "../../packages/remd-block-ids/src";
import { satteriBlockIds } from "../../packages/sat-block-ids/src";
import { comparable } from "../utils/hostile.js";
import { normalizeHtml } from "../utils/index.js";

// Raw HTML kept in every engine (markdown-it escapes it, remark-rehype drops it, Sätteri keeps it by default), so the cases with it can be compared.
const md = new MarkdownIt({ html: true }).use(blockIds);
const processor = unified()
  .use(remarkParse)
  .use(remarkBlockIds)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeStringify, { allowDangerousHtml: true });

const engines = [
  ["markdown-it", (input: string) => normalizeHtml(md.render(input))],
  [
    "remark",
    (input: string) => normalizeHtml(String(processor.processSync(input)))
  ],
  [
    "Sätteri",
    (input: string) =>
      normalizeHtml(
        markdownToHtml(input, {
          features: { gfm: false, frontmatter: false, smartPunctuation: false },
          mdastPlugins: [satteriBlockIds()]
        }).html
      )
  ]
] as const;

describe.each(engines)("block-ids edges (%s)", (_, render) => {
  // A marker's line is found and read by its line endings, which a document can write as CRLF or a lone CR: the marker on its own line goes with its line ending, and a space before the line ending still keeps it text. markdown-it turns a CR in text into a line feed, which `comparable` evens out.
  it.each([
    {
      name: "a marker on its own line after CRLF",
      input: "Some text\r\n^abc",
      expected: '<p id="^abc">Some text</p>'
    },
    {
      name: "a marker on its own line after a lone CR",
      input: "Some text\r^abc",
      expected: '<p id="^abc">Some text</p>'
    },
    {
      name: "a marker before CRLF and a paragraph",
      input: "text ^blk\r\n\r\nnext",
      expected: '<p id="^blk">text</p><p>next</p>'
    },
    {
      name: "a space after a marker before CRLF keeps it text",
      input: "text ^blk \r\n\r\nnext ^n",
      expected: '<p>text ^blk</p><p id="^n">next</p>'
    },
    {
      name: "a space after a marker before a lone CR keeps it text",
      input: "text ^blk \r\rnext ^n",
      expected: '<p>text ^blk</p><p id="^n">next</p>'
    },
    {
      name: "a marker alone after a paragraph, with CRLF",
      input: "para\r\n\r\n^own\r\n",
      expected: '<p id="^own">para</p>'
    },
    {
      name: "a marker in a nested item's own line, with CRLF",
      input: "- a\r\n  - b\r\n    ^id",
      expected: '<ul><li>a\n<ul><li id="^id">b</li></ul></li></ul>'
    },
    {
      name: "a marker alone in a quote, with CRLF",
      input: "> x\r\n>\r\n> ^b",
      expected: '<blockquote id="^b"><p>x</p></blockquote>'
    },
    {
      name: "a marker in a setext heading, with CRLF",
      input: "Heading ^h\r\n---",
      expected: '<h2 id="^h">Heading</h2>'
    }
  ])("$name", ({ input, expected }) => {
    expect(comparable(render(input))).toBe(expected);
  });

  // Raw HTML is not read, and has no element a marker after it could name.
  it.each([
    {
      name: "a marker in an HTML block is text",
      input: "<div>\nhtml ^blk\n</div>",
      expected: "<div>\nhtml ^blk\n</div>"
    },
    {
      name: "a marker alone after an HTML block names nothing",
      input: "<div>html</div>\n\n^html",
      expected: "<div>html</div>"
    },
    {
      name: "a marker after inline HTML names the paragraph",
      input: "text <b>bold</b> ^inline",
      expected: '<p id="^inline">text <b>bold</b></p>'
    },
    {
      name: "a marker inside inline HTML is text",
      input: "text <b>^blk</b>",
      expected: "<p>text <b>^blk</b></p>"
    }
  ])("$name", ({ input, expected }) => {
    expect(render(input)).toBe(expected);
  });

  // Text that a replacement string would read as a pattern, kept as written.
  it("keeps replacement patterns in the text before a marker", () => {
    expect(render("$& $1 $$ $` $' ^blk")).toBe(
      '<p id="^blk">$&amp; $1 $$ $` $\'</p>'
    );
  });
});
