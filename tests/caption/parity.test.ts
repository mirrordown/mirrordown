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

const engines = [
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
  /** Parse with GFM, for syntax markdown-it doesn't have (task lists): those cases leave markdown-it out. */
  gfm?: boolean;
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

describe.each(cases)(`caption parity: $name`, ({ input, expected, gfm }) => {
  it.each(
    engines.filter(({ engine }) => gfm !== true || engine !== `markdown-it`)
  )(`$engine`, ({ render }) => {
    expect(normalize(render(input, gfm === true))).toBe(expected);
  });
});
