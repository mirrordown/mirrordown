import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { parseCases, normalizeHtml } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cases = parseCases(read("fixtures/attrs.md"));

// Cases not supported by remd-attrs (mdit-specific token mechanics)
const UNSUPPORTED = new Set([
  // hr: thematic break with class — remark parses --- as thematicBreak but
  // the {.divider} paragraph follows; remd-attrs handles this via the hr rule.
  // list: nested list attr — the {.inner-list} is a softbreak inside a list item;
  // remark parses it differently and applies to the paragraph, not the list.
  "list: nested list attr",
]);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkAttrs)
        .use(remarkRehype)
        .use(rehypeStringify)
        .processSync(src),
    ),
  );

const supportedCases = cases.filter(({ name }) => !UNSUPPORTED.has(name));

test.each(supportedCases)("attrs (remark): $name", ({ input }) => {
  expect(remd(input)).toMatchSnapshot();
});
