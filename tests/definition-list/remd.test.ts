import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import {
  remarkDefinitionList,
  defListHastHandlers
} from "../../packages/remd-definition-list/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";
import { parityCases } from "./parity-cases.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/definition-list-commonmark.md"),
  read("expected/definition-list-commonmark.html")
);

const cmProcessor = unified()
  .use(remarkParse)
  .use(remarkDefinitionList)
  .use(remarkRehype, { handlers: defListHastHandlers })
  .use(rehypeStringify);

const htmlProcessor = unified()
  .use(remarkParse)
  .use(remarkDefinitionList)
  .use(remarkRehype, {
    handlers: defListHastHandlers,
    allowDangerousHtml: true
  })
  .use(rehypeStringify, { allowDangerousHtml: true });

// With GFM, for the cases about tables: the definition-list syntax shares the line's first character with nothing of GFM's, but reads the table rows before it.
const gfmProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm, { singleTilde: false })
  .use(remarkDefinitionList)
  .use(remarkRehype, {
    handlers: defListHastHandlers,
    allowDangerousHtml: true
  })
  .use(rehypeStringify, { allowDangerousHtml: true });

describe("definition-list/remd", () => {
  it.each(cmCases)("definition-list (remark): $name", ({ input, expected }) => {
    expect(normalizeHtml(String(cmProcessor.processSync(input)))).toBe(
      expected
    );
  });

  it.each(parityCases)(
    "definition-list (remark) parity: $name",
    ({ input, expected, gfm }) => {
      const processor = gfm ? gfmProcessor : htmlProcessor;
      expect(normalizeHtml(String(processor.processSync(input)))).toBe(
        expected
      );
    }
  );

  // The term has to end up inside the list: a `<dl>` that opens with a `<dd>` is invalid HTML. The resolver used to stop at the blockquote prefix on the blank line and never reached the term.
  it.each([
    ["> Term\n>\n> : Def", "<blockquote><dl><dt>Term</dt><dd>"],
    [
      "> para\n>\n> Term\n>\n> : Def\n>\n> after",
      "<blockquote><p>para</p><dl><dt>Term</dt><dd>"
    ],
    [
      "> T1\n> : D1\n>\n> T2\n>\n> : D2",
      "<blockquote><dl><dt>T1</dt><dd>D1</dd><dt>T2</dt><dd>"
    ]
  ])(
    "keeps the term in the list when a blank line separates it from the marker in a blockquote: %j",
    (input, start) => {
      const html = normalizeHtml(String(htmlProcessor.processSync(input)));
      expect(html.startsWith(start)).toBe(true);
    }
  );

  // A blank line inside a fenced code block is code, not a gap between the definition's blocks. Not in the parity table only because markdown-it writes no line break between a hidden paragraph and a `<pre>` (in a tight list item too), which the normalizer does not level.
  it("keeps a definition tight when its fenced code block holds a blank line", () => {
    expect(
      normalizeHtml(
        String(
          htmlProcessor.processSync("Term\n: para\n  ```\n  a\n\n  b\n  ```")
        )
      )
    ).toBe(
      "<dl><dt>Term</dt><dd>para\n<pre><code>a\n\nb\n</code></pre></dd></dl>"
    );
  });

  // Passing `defListHastHandlers` is easy to forget, and mdast-util-to-hast turns a node it has no handler for into a `<div>`. The nodes name their own elements so that the forgotten case is still a definition list; only the unwrapping of a tight definition's paragraph needs the handlers.
  it("still renders dl, dt and dd when the host passes no hast handlers", () => {
    const bare = unified()
      .use(remarkParse)
      .use(remarkDefinitionList)
      .use(remarkRehype)
      .use(rehypeStringify);
    expect(normalizeHtml(String(bare.processSync("Term\n: Def")))).toBe(
      "<dl><dt>Term</dt><dd><p>Def</p></dd></dl>"
    );
  });
});
