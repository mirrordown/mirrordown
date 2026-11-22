import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { blockIds } from "../../packages/mdit-block-ids/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/block-ids-commonmark.md"),
  read("expected/block-ids-commonmark.html")
);
const gfmCases = parseFixture(
  read("fixtures/block-ids-gfm.md"),
  read("expected/block-ids-gfm.html")
);

const md = new MarkdownIt().use(blockIds);

describe("block-ids/mdit", () => {
  it.each(cmCases)("block-ids (markdown-it): $name", ({ input, expected }) => {
    expect(normalizeHtml(md.render(input))).toBe(expected);
  });

  it.each(gfmCases)(
    "block-ids (markdown-it) gfm: $name",
    ({ input, expected }) => {
      expect(normalizeHtml(md.render(input))).toBe(expected);
    }
  );

  // markdown-it renders an indented code block's attributes on its `<pre>`, and a fence's language class after them; the plugin's renderer wrappers keep both where remark and Sätteri put them. A highlighter that writes its own `<pre>` replaces the renderer's output, and the id with it.
  it("puts a code block's id on its <code>, after a fence's language class", () => {
    expect(normalizeHtml(md.render("para\n\n    code\n\n^a"))).toBe(
      '<p>para</p><pre><code id="^a">code\n</code></pre>'
    );
    expect(normalizeHtml(md.render("```js\ncode\n```\n\n^b"))).toBe(
      '<pre><code class="language-js" id="^b">code\n</code></pre>'
    );
  });

  // Typographer replacements run after the plugin, so an identifier written with `--` is read before it becomes a dash.
  it("reads a marker before the typographer rewrites it", () => {
    const typographer = new MarkdownIt({ typographer: true }).use(blockIds);
    expect(normalizeHtml(typographer.render("text ^a--b"))).toBe(
      '<p id="^a--b">text</p>'
    );
  });
});
