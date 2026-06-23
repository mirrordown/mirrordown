import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkRuby } from "../../packages/remd-ruby/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/ruby-commonmark.md"),
  read("expected/ruby-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/ruby-gfm.md"),
  read("expected/ruby-gfm.html")
);

const remdCases = parseFixture(
  read("fixtures/ruby-remd.md"),
  read("expected/ruby-remd.html")
);

const htmlCases = parseFixture(
  read("fixtures/ruby-html.md"),
  read("expected/ruby-html.html")
);

const cmProcessor = unified()
  .use(remarkParse)
  .use(remarkRuby)
  .use(remarkRehype)
  .use(rehypeStringify);

const gfmProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRuby)
  .use(remarkRehype)
  .use(rehypeStringify);

const htmlProcessor = unified()
  .use(remarkParse)
  .use(remarkRuby)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeStringify, { allowDangerousHtml: true });

describe("ruby/remd", () => {
  it.each(cmCases)("ruby (remark): $name", ({ input, expected }) => {
    expect(normalizeHtml(String(cmProcessor.processSync(input)))).toBe(
      expected
    );
  });

  it.each(gfmCases)("ruby (remark) gfm: $name", ({ input, expected }) => {
    expect(normalizeHtml(String(gfmProcessor.processSync(input)))).toBe(
      expected
    );
  });

  it.each(remdCases)(
    "ruby (remark) strikethrough: $name",
    ({ input, expected }) => {
      expect(normalizeHtml(String(gfmProcessor.processSync(input)))).toBe(
        expected
      );
    }
  );

  it.each(htmlCases)("ruby (remark) html: $name", ({ input, expected }) => {
    expect(normalizeHtml(String(htmlProcessor.processSync(input)))).toBe(
      expected
    );
  });
});
