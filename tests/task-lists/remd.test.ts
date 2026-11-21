import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import {
  remarkTaskLists,
  taskListsHastHandlers
} from "../../packages/remd-task-lists/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/task-lists-commonmark.md"),
  read("expected/task-lists-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/task-lists-gfm.md"),
  read("expected/task-lists-gfm.html")
);

const cmProcessor = unified()
  .use(remarkParse)
  .use(remarkTaskLists)
  .use(remarkRehype, { handlers: taskListsHastHandlers })
  .use(rehypeStringify);

const gfmProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkTaskLists)
  .use(remarkRehype, { handlers: taskListsHastHandlers })
  .use(rehypeStringify);

describe("task-lists/remd", () => {
  it.each(cmCases)("task-lists (remark): $name", ({ input, expected }) => {
    expect(normalizeHtml(String(cmProcessor.processSync(input)))).toBe(
      expected
    );
  });

  // With GFM on, remark-gfm has read `[ ]` and `[x]` before the plugin runs, and the plugin reads the rest: the same cases must come out the same.
  it.each(cmCases)(
    "task-lists (remark) with GFM: $name",
    ({ input, expected }) => {
      expect(normalizeHtml(String(gfmProcessor.processSync(input)))).toBe(
        expected
      );
    }
  );

  it.each(gfmCases)("task-lists (remark) gfm: $name", ({ input, expected }) => {
    expect(normalizeHtml(String(gfmProcessor.processSync(input)))).toBe(
      expected
    );
  });
});

// mdast-util-to-hast draws the box from `checked` and gives it no name: the handlers add the label. Without them a task still renders, unlabelled, so a screen reader announces only a checkbox.
describe("task-lists/remd without taskListsHastHandlers", () => {
  it("renders every task, with no label on the box", () => {
    const html = unified()
      .use(remarkParse)
      .use(remarkTaskLists)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync("- [?] a\n- [x] b");
    expect(normalizeHtml(String(html))).toBe(
      '<ul class="contains-task-list"><li class="task-list-item" data-task="?"><input type="checkbox" disabled> a</li><li class="task-list-item"><input type="checkbox" checked disabled> b</li></ul>'
    );
  });
});
