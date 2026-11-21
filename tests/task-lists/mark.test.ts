import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import {
  taskLists,
  type TaskListsOptions
} from "../../packages/mdit-task-lists/src";
import { mark } from "../../packages/mdit-mark/src";
import {
  remarkTaskLists,
  taskListsHastHandlers
} from "../../packages/remd-task-lists/src";
import { remarkMark } from "../../packages/remd-mark/src";
import { satteriTaskLists } from "../../packages/sat-task-lists/src";
import { satteriMark } from "../../packages/sat-mark/src";
import { normalizeHtml } from "../utils/index.js";

// An inline plugin listed after task-lists reads the item's text without its box. That text must still line up with the source, or a plugin that reads escapes from it (mark here) takes an escaped delimiter for a real one.
const engines = (
  options: TaskListsOptions = {}
): Array<[string, (src: string) => string]> => {
  const md = new MarkdownIt().use(taskLists, options).use(mark);
  const processor = unified()
    .use(remarkParse)
    .use(remarkTaskLists, options)
    .use(remarkMark)
    .use(remarkRehype, { handlers: taskListsHastHandlers })
    .use(rehypeStringify);
  return [
    ["markdown-it", (src) => normalizeHtml(md.render(src))],
    ["remark", (src) => normalizeHtml(String(processor.processSync(src)))],
    [
      "sätteri",
      (src) =>
        normalizeHtml(
          markdownToHtml(src, {
            features: { gfm: false, frontmatter: false, smartPunctuation: false },
            mdastPlugins: [satteriTaskLists(options), satteriMark()]
          }).html
        )
    ]
  ];
};

const item = (marker: string, label: string, text: string): string =>
  `<ul class="contains-task-list"><li class="task-list-item" data-task="${marker}"><input type="checkbox" disabled${label}>${text}</li></ul>`;

describe.each(engines())("task-lists + mark (%s)", (_engine, render) => {
  it.each([
    ["- [?] ==a==", item("?", ' aria-label="Question"', " <mark>a</mark>")],
    [
      "- [?] \\==a== ==b==",
      item("?", ' aria-label="Question"', " ==a== <mark>b</mark>")
    ],
    [
      "- [?]\n  \\==a== ==b==",
      item("?", ' aria-label="Question"', " ==a== <mark>b</mark>")
    ]
  ])("%j", (input, expected) => {
    expect(render(input)).toBe(expected);
  });
});
