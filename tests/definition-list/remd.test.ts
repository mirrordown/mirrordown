import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
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

describe("definition-list/remd", () => {
  it.each(cmCases)("definition-list (remark): $name", ({ input, expected }) => {
    expect(normalizeHtml(String(cmProcessor.processSync(input)))).toBe(
      expected
    );
  });

  it.each(parityCases)(
    "definition-list (remark) parity: $name",
    ({ input, expected }) => {
      expect(normalizeHtml(String(htmlProcessor.processSync(input)))).toBe(
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
});
