import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import {
  remarkSpoiler,
  spoilerHastHandlers
} from "../../packages/remd-spoiler/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/spoiler-commonmark.md"),
  read("expected/spoiler-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/spoiler-gfm.md"),
  read("expected/spoiler-gfm.html")
);

const cmProcessor = unified()
  .use(remarkParse)
  .use(remarkSpoiler)
  .use(remarkRehype, { handlers: spoilerHastHandlers })
  .use(rehypeStringify);

const gfmProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkSpoiler)
  .use(remarkRehype, { handlers: spoilerHastHandlers })
  .use(rehypeStringify);

describe("spoiler/remd", () => {
  it.each(cmCases)("spoiler (remark): $name", ({ input, expected }) => {
    expect(normalizeHtml(String(cmProcessor.processSync(input)))).toBe(
      expected
    );
  });

  it.each(gfmCases)("spoiler (remark) gfm: $name", ({ input, expected }) => {
    expect(normalizeHtml(String(gfmProcessor.processSync(input)))).toBe(
      expected
    );
  });

  // The element is built by `spoilerHastHandlers`, which the caller has to hand to remark-rehype, and nothing can check that they did. remark-rehype's default for an unknown node is a `<div>` holding the content: the secret in the clear, in a block element inside a paragraph. The node therefore carries a fallback that renders the content span alone, which the stylesheet covers and nothing reveals: a spoiler that cannot be opened is a visible mistake, one that shows its content is a silent one.
  it("keeps the content covered when the handlers were not passed to remark-rehype", () => {
    const unconfigured = unified()
      .use(remarkParse)
      .use(remarkSpoiler)
      .use(remarkRehype)
      .use(rehypeStringify);
    expect(String(unconfigured.processSync("a ||b|| c"))).toBe(
      '<p>a <span class="markdown-spoiler-content">b</span> c</p>'
    );
  });
});
