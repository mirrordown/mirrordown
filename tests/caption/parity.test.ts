import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { caption } from "../../packages/mdit-caption/src";
import { remarkCaption } from "../../packages/remd-caption/src";
import { satteriCaption } from "../../packages/sat-caption/src";
import { normalizeHtml } from "../utils/index.js";

// The caption plugin alone in each engine, for inputs a fixture file can't hold (carriage returns, trailing backslashes) and for the places the engines' recognition once disagreed. Every case must render the same HTML in all three.
const md = new MarkdownIt().use(caption);

const engines: Array<{
  engine: string;
  render: (input: string, gfm: boolean) => string;
}> = [
  { engine: `markdown-it`, render: (input: string) => md.render(input) },
  {
    engine: `remark`,
    render: (input: string, gfm: boolean) =>
      String(
        unified()
          .use(remarkParse)
          .use(gfm ? [remarkGfm] : [])
          .use(remarkCaption)
          .use(remarkRehype)
          .use(rehypeStringify)
          .processSync(input)
      )
  },
  {
    engine: `sätteri`,
    render: (input: string, gfm: boolean) =>
      markdownToHtml(input, {
        features: { gfm, frontmatter: false, smartPunctuation: false },
        mdastPlugins: [satteriCaption()]
      }).html
  }
];

interface Case {
  name: string;
  input: string;
  expected: string;
}

const FIGURE = `<figure class="markdown-caption">`;

const cases: Case[] = [
  // A caption line is found by its source line, so the source must be split into the lines the parser counted, whatever the document's line endings; a carriage return left where the caption line was cut would end up in the page.
  {
    name: `line endings: a CRLF document's caption leaves no carriage return behind`,
    input: `![A](a.jpg)\r\n~: cap`,
    expected: `${FIGURE}<img src="a.jpg" alt="A"><figcaption>cap</figcaption></figure>`
  },
  {
    name: `line endings: a CRLF paragraph ends where its caption starts`,
    input: `Text\r\nmore\r\n~: cap`,
    expected: `${FIGURE}<p>Text\nmore</p><figcaption>cap</figcaption></figure>`
  },
  {
    name: `line endings: a lone carriage return ends a line too`,
    input: `Text\rmore\r~: cap`,
    expected: `${FIGURE}<p>Text\nmore</p><figcaption>cap</figcaption></figure>`
  },
  // Inline content that spans lines keeps them together as one line of the paragraph, so a later line isn't "the paragraph's first line plus its index": read that way, the caption line was tested against the wrong source line and silently stayed text.
  {
    name: `spanning inline: a caption after emphasis that spans lines`,
    input: `*emph\nmore* text\n~: caption`,
    expected: `${FIGURE}<p><em>emph\nmore</em> text</p><figcaption>caption</figcaption></figure>`
  },
  {
    name: `spanning inline: a caption after a code span that spans lines`,
    input: "`a\nb` text\n~: caption",
    expected: `${FIGURE}<p><code>a b</code> text</p><figcaption>caption</figcaption></figure>`
  },
  // A line that starts inside emphasis or a link isn't a line of the paragraph to cut at: cutting there closed the paragraph inside the element and the element inside the caption, which is invalid HTML.
  {
    name: `spanning inline: a marker inside emphasis is text`,
    input: `![i](a.jpg) *foo\n~: bar*`,
    expected: `<p><img src="a.jpg" alt="i"> <em>foo\n~: bar</em></p>`
  },
  {
    name: `spanning inline: a marker inside a link's text is text`,
    input: `![i](a.jpg) [foo\n~: bar](u)`,
    expected: `<p><img src="a.jpg" alt="i"> <a href="u">foo\n~: bar</a></p>`
  },
  // A caption line indented to a list item's content is written inside the item, so it captions the item's block and not the whole list. Where the item's content starts is the marker's to say: the item's first block can start further right.
  {
    name: `list: a caption in an item whose content starts on its second line`,
    input: `-\n    foo\n  ~: cap`,
    expected: `<ul><li>${FIGURE}<p>foo</p><figcaption>cap</figcaption></figure></li></ul>`
  },
  // A link reference definition between a block and a caption line separates them, and the caption stays text. markdown-it leaves no token for a definition, so its rule reads the source: by the lines no block covers, not by what the line above looks like, which is wrong for a definition that ends on a line of its own and for code that reads like one.
  {
    name: `definition: one ending on a line that doesn't look like one still separates the caption`,
    input: "```\ncode\n```\n[a]:\nb\n~: cap",
    expected: `<pre><code>code\n</code></pre><p>~: cap</p>`
  },
  {
    name: `definition: indented code that looks like one takes its caption`,
    input: `Indented:\n\n    [home]: x\n~: A caption`,
    expected: `<p>Indented:</p>${FIGURE}<pre><code>[home]: x\n</code></pre><figcaption>A caption</figcaption></figure>`
  },
  // The break has nothing to break before: the caption ends there, as a paragraph ends at the hard break before its caption. Kept, it rendered a `<br>` at the end of the `<figcaption>` in two engines of three.
  {
    name: `hard break: one ending an inner caption isn't part of it`,
    input: `> > Inner\n> ~: inner\\\n~: outer`,
    expected: `${FIGURE}<blockquote>${FIGURE}<blockquote><p>Inner</p></blockquote><figcaption>inner</figcaption></figure></blockquote><figcaption>outer</figcaption></figure>`
  }
];

// remark and Sätteri keep a document's own line endings inside text, which markdown-it normalizes; that's the parser's, so the comparison reads them alike.
const normalize = (html: string): string =>
  normalizeHtml(html).replace(/\r\n?/g, `\n`);

describe.each(cases)(`caption parity: $name`, ({ input, expected }) => {
  it.each(engines)(`$engine`, ({ render }) => {
    expect(normalize(render(input, false))).toBe(expected);
  });
});

// A task item's paragraph starts after its `[ ]`, right of the item's content column, so a caption line at that column was read as written outside the item and captioned the whole list. markdown-it has no task lists, and the two renderers space the checkbox before a block differently, so this reads the parts that matter.
describe(`caption parity: a caption in a task item captions the task, as in any other item`, () => {
  it.each(engines.filter(({ engine }) => engine !== `markdown-it`))(
    `$engine`,
    ({ render }) => {
      const html = normalize(
        render(
          `- [ ] Task
  ~: cap
- [ ] Two`,
          true
        )
      );
      expect(html.startsWith(`<ul class="contains-task-list">`)).toBe(true);
      expect(html).toContain(
        `${FIGURE}<p>Task</p><figcaption>cap</figcaption></figure></li>`
      );
    }
  );
});
