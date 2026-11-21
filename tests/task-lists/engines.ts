import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import {
  taskLists,
  type TaskListsOptions
} from "../../packages/mdit-task-lists/src";
import {
  remarkTaskLists,
  taskListsHastHandlers
} from "../../packages/remd-task-lists/src";
import { satteriTaskLists } from "../../packages/sat-task-lists/src";
import { normalizeHtml } from "../utils/index.js";

type Render = (input: string) => string;

export const markdownIt = (options?: TaskListsOptions): Render => {
  const md = new MarkdownIt().use(taskLists, options);
  return (input) => normalizeHtml(md.render(input));
};

export const remark = (gfm: boolean, options?: TaskListsOptions): Render => {
  const processor = unified()
    .use(remarkParse)
    .use(gfm ? [remarkGfm] : [])
    .use(remarkTaskLists, options)
    .use(remarkRehype, { handlers: taskListsHastHandlers })
    .use(rehypeStringify);
  return (input) => normalizeHtml(String(processor.processSync(input)));
};

export const satteri =
  (gfm: boolean, options?: TaskListsOptions): Render =>
  (input) =>
    normalizeHtml(
      markdownToHtml(input, {
        features: { gfm, frontmatter: false, smartPunctuation: false },
        mdastPlugins: [satteriTaskLists(options)]
      }).html
    );

/** Every pipeline a document must render the same in: each engine, and remark and Sätteri with GFM off and on. */
export const pipelines = (
  options?: TaskListsOptions
): ReadonlyArray<readonly [string, Render]> => [
  [`markdown-it`, markdownIt(options)],
  [`remark`, remark(false, options)],
  [`remark with GFM`, remark(true, options)],
  [`sätteri`, satteri(false, options)],
  [`sätteri with GFM`, satteri(true, options)]
];
