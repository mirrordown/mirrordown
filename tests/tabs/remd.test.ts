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

// Author attributes reach the handler through `data.hProperties`. remd-attrs spells a class `class`, but hast and most remark plugins spell it `className`, which used to be spread next to the element's own `class`: the element rendered two class attributes and browsers drop the second.
describe("tabs/remd: author classes join the element's own, however they are spelled", () => {
  const withProperties = (properties: Record<string, unknown>) =>
    normalizeHtml(
      String(
        unified()
          .use(remarkParse)
          .use(remarkTabs)
          .use(() => (tree) => {
            const list = tree.children.find(
              (node) => (node.type as string) === "tabsList"
            );
            if (list) list.data = { hProperties: properties } as never;
          })
          .use(remarkRehype, { handlers: tabsHastHandlers as never })
          .use(rehypeStringify)
          .processSync("% A\n> b")
      )
    );

  it("merges a className list into the class attribute", () => {
    const html = withProperties({ className: ["x", "y"] });
    expect(html).toContain(
      `<div class="markdown-tabs x y" data-tabs-group="2b606">`
    );
  });

  it("still merges a class string, with other properties after the element's own", () => {
    const html = withProperties({ class: "x", id: "mine" });
    expect(html).toContain(
      `<div class="markdown-tabs x" data-tabs-group="2b606" id="mine">`
    );
  });
});
