import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { squeezeParagraphs } from "../../packages/mdit-squeeze-paragraphs/src";
import { rehypeSqueezeParagraphs } from "../../packages/remd-squeeze-paragraphs/src";
import { satteriSqueezeParagraphs } from "../../packages/sat-squeeze-paragraphs/src";
import { normalizeHtml } from "../utils/index.js";

// Each engine with squeeze-paragraphs alone, returning the HTML as the engine wrote it.
const engines = [
  {
    engine: `markdown-it`,
    render: (input: string) =>
      new MarkdownIt().use(squeezeParagraphs).render(input)
  },
  {
    engine: `remark`,
    render: (input: string) =>
      String(
        unified()
          .use(remarkParse)
          .use(remarkRehype)
          .use(rehypeSqueezeParagraphs)
          .use(rehypeStringify)
          .processSync(input)
      )
  },
  {
    engine: `sätteri`,
    render: (input: string) =>
      markdownToHtml(input, {
        features: { smartPunctuation: false },
        hastPlugins: [satteriSqueezeParagraphs()]
      }).html
  }
];

// "Empty" means HTML's inter-element whitespace (space, tab, line feed, form feed, carriage return) and nothing else, in every engine. A no-break space or another Unicode space is content the author put there on purpose (`&nbsp;` on its own line is the usual hand-written spacer), so removing it would delete something visible. These assert on the raw output, because `normalizeHtml` cannot be trusted to keep such a character between two tags.
describe.each(engines)(
  "squeeze-paragraphs ($engine): a Unicode space is content, not emptiness",
  ({ render }) => {
    it.each([
      { name: `no-break space`, source: `&nbsp;`, char: ` ` },
      { name: `literal no-break space`, source: ` `, char: ` ` },
      { name: `ideographic space`, source: `&#x3000;`, char: `　` },
      { name: `en space`, source: `&ensp;`, char: ` ` },
      { name: `zero width no-break space`, source: `&#xFEFF;`, char: `﻿` }
    ])("keeps a paragraph holding only a $name", ({ source, char }) => {
      expect(render(`a\n\n${source}\n\nb`).trim()).toBe(
        `<p>a</p>\n<p>${char}</p>\n<p>b</p>`
      );
    });

    it("keeps a no-break space that is a tight list item's only content", () => {
      expect(render(`- &nbsp;`).trim()).toBe(`<ul>\n<li> </li>\n</ul>`);
    });

    // The other side of the same rule: all five whitespace characters count, so no engine keeps a paragraph the others remove.
    it.each([`&#32;`, `&#9;`, `&#10;`, `&#12;`, `&#13;`, `&#32;\n&#9;`])(
      "removes a paragraph holding only %j",
      (source) => {
        expect(normalizeHtml(render(`a\n\n${source}\n\nb`))).toBe(
          `<p>a</p><p>b</p>`
        );
      }
    );
  }
);
