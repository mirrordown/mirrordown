import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { taskLists } from "../../packages/mdit-task-lists/src";
import { githubAlerts } from "../../packages/mdit-github-alerts/src";
import {
  remarkTaskLists,
  taskListsHastHandlers
} from "../../packages/remd-task-lists/src";
import {
  remarkGithubAlerts,
  githubAlertsHastHandlers
} from "../../packages/remd-github-alerts/src";
import { satteriTaskLists } from "../../packages/sat-task-lists/src";
import { satteriGithubAlerts } from "../../packages/sat-github-alerts/src";
import { normalizeHtml } from "../utils/index.js";

// A task list inside an alert: both plugins rebuild what they read, so neither may lose the other's work, whichever runs first.
const md = new MarkdownIt().use(githubAlerts, { icons: false }).use(taskLists);
const processor = unified()
  .use(remarkParse)
  .use(remarkTaskLists)
  .use(remarkGithubAlerts, { icons: false })
  .use(remarkRehype, {
    handlers: { ...githubAlertsHastHandlers, ...taskListsHastHandlers }
  })
  .use(rehypeStringify);

const engines: [string, (src: string) => string][] = [
  ["markdown-it", (src) => normalizeHtml(md.render(src))],
  ["remark", (src) => normalizeHtml(String(processor.processSync(src)))],
  [
    "sätteri",
    (src) =>
      normalizeHtml(
        markdownToHtml(src, {
          features: { gfm: false, frontmatter: false, smartPunctuation: false },
          mdastPlugins: [
            satteriTaskLists(),
            satteriGithubAlerts({ icons: false })
          ]
        }).html
      )
  ]
];

describe.each(engines)("task-lists + github-alerts (%s)", (_engine, render) => {
  it("reads a task list inside an alert", () => {
    expect(render("> [!NOTE]\n> - [ ] to-do\n> - [!] important")).toBe(
      '<div class="markdown-alert" data-alert="note"><p class="markdown-alert-title" aria-label="Note">Note</p><ul class="contains-task-list"><li class="task-list-item"><input type="checkbox" disabled> to-do</li><li class="task-list-item" data-task="!"><input type="checkbox" disabled aria-label="Important"> important</li></ul></div>'
    );
  });

  // `[!NOTE]` in a list item is not a task: one character makes a marker.
  it("leaves an alert marker in a list item as text", () => {
    expect(render("- [!NOTE] text")).toBe("<ul><li>[!NOTE] text</li></ul>");
  });
});
