import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkTabs, tabsHastHandlers } from "../../packages/remd-tabs/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cases = parseFixture(
  read("fixtures/tabs.md"),
  read("expected/tabs.html")
);

const process = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkTabs)
        .use(remarkRehype, { handlers: tabsHastHandlers as never })
        .use(rehypeStringify, { allowDangerousHtml: true })
        .processSync(src)
    )
  );

describe("tabs/remd", () => {
  it.each(cases)("tabs (remark): $name", ({ input, expected }) => {
    expect(process(input)).toBe(expected);
  });
});
