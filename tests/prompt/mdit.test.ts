import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { prompt } from "../../packages/mdit-prompt/src";
import { fixtures, type Syntax } from "./options.js";

// The page's syntax is what a preview renders: markdown-it's own tables, plus GFM's literal links, or raw HTML.
const engines: Record<Syntax, MarkdownIt> = {
  commonmark: new MarkdownIt().use(prompt),
  gfm: new MarkdownIt({ linkify: true }).use(prompt),
  html: new MarkdownIt({ html: true }).use(prompt)
};

describe("prompt/mdit", () => {
  // markdown-it writes the expected HTML the other engines are held to.
  it.each(Object.keys(fixtures) as Syntax[])(
    "prompt (markdown-it): %s fixtures",
    async (syntax) => {
      const md = engines[syntax];
      const html = fixtures[syntax].inputs
        .map(
          ({ name, input }) => `<!-- @case: ${name} -->\n\n${md.render(input)}`
        )
        .join(`\n`);
      await expect(html).toMatchFileSnapshot(fixtures[syntax].expectedPath);
    }
  );

  // VS Code's preview scrolls the editor and the preview together by each block's source lines: a preview's blocks have the document's.
  it("gives the preview's blocks their lines in the document", () => {
    const tokens = new MarkdownIt()
      .use(prompt)
      .parse("Intro\n\n> ```prompt\n> # Task\n>\n> Do it.\n> ```", {});
    const lines = Object.fromEntries(
      tokens
        .filter((token) => token.type === `inline`)
        .map((token) => [token.content, token.map?.[0]])
    );
    expect(lines).toEqual({ Intro: 0, Task: 3, "Do it.": 5 });
  });
});
