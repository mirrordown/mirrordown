import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { dl } from "../../packages/mdit-definition-list/src";
import {
  remarkDefinitionList,
  defListHastHandlers
} from "../../packages/remd-definition-list/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";
import { parityCases } from "./parity-cases.js";

// Sätteri parses definition lists natively, so there is no sat-definition-list package: these tests check that its `definitionList` feature renders what the markdown-it and remark plugins do, which is the parity contract for this set.

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/definition-list-commonmark.md"),
  read("expected/definition-list-commonmark.html")
);

const render = (input: string, gfm = false): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: {
        gfm,
        definitionList: true,
        frontmatter: false,
        smartPunctuation: false
      }
    }).html
  );

// The two plugins, for the block at the end that pins where the engines differ
const md = new MarkdownIt().use(dl);
const renderMdit = (input: string): string => normalizeHtml(md.render(input));

const renderRemd = (input: string, gfm = false): string => {
  const processor = unified().use(remarkParse);
  if (gfm) processor.use(remarkGfm, { singleTilde: false });
  return normalizeHtml(
    String(
      processor
        .use(remarkDefinitionList)
        .use(remarkRehype, { handlers: defListHastHandlers })
        .use(rehypeStringify)
        .processSync(input)
    )
  );
};

interface Difference {
  name: string;
  input: string;
  gfm?: boolean;
  mdit: string;
  remd: string;
  sat: string;
}

// Where Sätteri's built-in stands alone. It cannot be changed from here, and in each of these it is also at odds with itself or with CommonMark's list-item rules, so the plugins were not moved to it. All three outputs are pinned: a change in any engine has to be noticed, and the decision (follow Sätteri, or keep documenting the difference) is the owner's.
const satteriDifferences: Difference[] = [
  {
    name: "a blank line between a bare marker and the next marker ends Sätteri's list",
    input: "T\n:\n\n: D2",
    mdit: "<dl><dt>T</dt><dd></dd><dd><p>D2</p></dd></dl>",
    remd: "<dl><dt>T</dt><dd></dd><dd><p>D2</p></dd></dl>",
    sat: "<dl><dt>T</dt><dd></dd></dl><p>: D2</p>"
  },
  {
    name: "Sätteri takes a line indented one column as the content of a bare marker",
    input: "T\n:\n content",
    mdit: "<dl><dt>T</dt><dd></dd></dl><p>content</p>",
    remd: "<dl><dt>T</dt><dd></dd></dl><p>content</p>",
    sat: "<dl><dt>T</dt><dd>content</dd></dl>"
  },
  {
    name: "Sätteri reads five columns under a bare marker as indented code",
    input: "T\n:\n     content",
    mdit: "<dl><dt>T</dt><dd>content</dd></dl>",
    remd: "<dl><dt>T</dt><dd>content</dd></dl>",
    sat: "<dl><dt>T</dt><dd><pre><code>content\n</code></pre></dd></dl>"
  },
  {
    name: "Sätteri keeps one more column of indented code under a bare marker",
    input: "T\n:\n      content",
    mdit: "<dl><dt>T</dt><dd><pre><code>content\n</code></pre></dd></dl>",
    remd: "<dl><dt>T</dt><dd><pre><code>content\n</code></pre></dd></dl>",
    sat: "<dl><dt>T</dt><dd><pre><code> content\n</code></pre></dd></dl>"
  },
  {
    // Sätteri renders the same shape loose at the top level, in a list item, and for a later term in the same blockquote
    name: "Sätteri keeps a first definition in a blockquote tight after a blank line",
    input: "> Term\n>\n> : Def",
    mdit: "<blockquote><dl><dt>Term</dt><dd><p>Def</p></dd></dl></blockquote>",
    remd: "<blockquote><dl><dt>Term</dt><dd><p>Def</p></dd></dl></blockquote>",
    sat: "<blockquote><dl><dt>Term</dt><dd>Def</dd></dl></blockquote>"
  },
  {
    // Sätteri does render this loose when the block above the blank line is a paragraph or a blockquote
    name: "Sätteri keeps a definition tight when a blank line follows a nested list",
    input: "T\n: a\n  - b\n\n  c",
    mdit: "<dl><dt>T</dt><dd><p>a</p><ul><li>b</li></ul><p>c</p></dd></dl>",
    remd: "<dl><dt>T</dt><dd><p>a</p><ul><li>b</li></ul><p>c</p></dd></dl>",
    sat: "<dl><dt>T</dt><dd>a\n<ul><li>b</li></ul>\nc</dd></dl>"
  }
];

// Known defects in one of the plugins, not engine limits: Sätteri's output is the expected one and the plugin has not been brought to it yet. Pinned so that the fix, or a regression in the engines that are right, shows up here.
const pluginDifferences: Difference[] = [
  {
    // remark-gfm alone makes the line a table row; with the definition-list syntax loaded the table ends at the delimiter row
    name: "remark drops a marker-like line out of a GFM table that has no body yet",
    input: "| a |\n| - |\n: D2",
    gfm: true,
    mdit: "<table><thead><tr><th>a</th></tr></thead><tbody><tr><td>: D2</td></tr></tbody></table>",
    remd: "<table><thead><tr><th>a</th></tr></thead></table><p>: D2</p>",
    sat: "<table><thead><tr><th>a</th></tr></thead><tbody><tr><td>: D2</td></tr></tbody></table>"
  },
  {
    // The marker sits at the definition's content column, where only a nested list could start, and there is no term for one
    name: "markdown-it ends a nested list item at a marker that cannot start a definition",
    input: "T\n: - a\n  : x",
    mdit: "<dl><dt>T</dt><dd><ul><li>a</li></ul>\n: x</dd></dl>",
    remd: "<dl><dt>T</dt><dd><ul><li>a\n: x</li></ul></dd></dl>",
    sat: "<dl><dt>T</dt><dd><ul><li>a\n: x</li></ul></dd></dl>"
  }
];

describe("definition-list/sat", () => {
  it.each(cmCases)(
    "definition-list (sätteri): $name",
    ({ input, expected }) => {
      expect(render(input)).toBe(expected);
    }
  );

  it.each(parityCases)(
    "definition-list (sätteri) parity: $name",
    ({ input, expected }) => {
      expect(render(input)).toBe(expected);
    }
  );

  describe("engine differences", () => {
    it.each([...satteriDifferences, ...pluginDifferences])(
      "$name",
      ({ input, gfm, mdit, remd, sat }) => {
        expect({
          mdit: renderMdit(input),
          remd: renderRemd(input, gfm),
          sat: render(input, gfm)
        }).toEqual({ mdit, remd, sat });
      }
    );
  });
});
