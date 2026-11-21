import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root } from "mdast";
import { markdownToHtml } from "satteri";
import {
  taskLists,
  type TaskListsOptions
} from "../../packages/mdit-task-lists/src";
import { remarkTaskLists } from "../../packages/remd-task-lists/src";
import { satteriTaskLists } from "../../packages/sat-task-lists/src";
import {
  HOSTILE_TIME_LIMIT,
  comparable,
  hostileCases
} from "../utils/hostile.js";
import { pipelines } from "./engines.js";

const timed = (run: () => void): number => {
  const started = performance.now();
  run();
  return performance.now() - started;
};

// How much longer each pipeline takes with the plugin than without it. remark takes seconds over a long list by itself, with a second of noise in its parse and its conversion to hast, so only the plugin's transform is timed there: its hast handler labels a box it is handed, and the full pipelines still run in the parity check.
type Cost = readonly [string, (input: string) => number];

const costs = (options: TaskListsOptions): Cost[] => {
  const plain = new MarkdownIt();
  const md = new MarkdownIt().use(taskLists, options);
  const satteri = (gfm: boolean) => (input: string) =>
    timed(() =>
      markdownToHtml(input, {
        features: { gfm, frontmatter: false, smartPunctuation: false },
        mdastPlugins: [satteriTaskLists(options)]
      })
    ) -
    timed(() =>
      markdownToHtml(input, {
        features: { gfm, frontmatter: false, smartPunctuation: false }
      })
    );
  const remark = (gfm: boolean) => {
    const parser = unified()
      .use(remarkParse)
      .use(gfm ? [remarkGfm] : []);
    const transform = unified().use(remarkTaskLists, options);
    return (input: string) => {
      const tree: Root = parser.parse(input);
      return timed(() => transform.runSync(tree, input));
    };
  };
  return [
    [
      `markdown-it`,
      (input) =>
        timed(() => md.render(input)) - timed(() => plain.render(input))
    ],
    [`remark`, remark(false)],
    [`remark with GFM`, remark(true)],
    [`sätteri`, satteri(false)],
    [`sätteri with GFM`, satteri(true)]
  ];
};

// Input an author would never write on purpose still arrives: pasted logs, generated files, text from another system. None of it may throw, hang, or make the engines disagree, and the plugin may not take long over it in any pipeline. The engines are compared on `sample`: a thousand list items say as much about parity as twenty thousand, which remark alone takes seconds to render.
const measure = (
  options: TaskListsOptions,
  input: string,
  sample = input
): { html: string[]; slowest: number } => ({
  html: pipelines(options).map(([, render]) => comparable(render(sample))),
  slowest: Math.max(...costs(options).map(([, cost]) => cost(input)))
});

describe.each([
  ["the defaults", {}],
  ["fallback", { fallback: true }]
] as const)("hostile input through task-lists (%s)", (_name, options) => {
  it.each(hostileCases((text) => `- [?] ${text}`, `[`))(
    "$name",
    { timeout: 60_000 },
    ({ input }) => {
      const { html, slowest } = measure(options, input);
      expect(html).toStrictEqual(html.map(() => html[0]));
      expect(slowest).toBeLessThan(HOSTILE_TIME_LIMIT);
    }
  );
});

// What a scan for a box would restart on: a long run of the box's characters and of whitespace, and long lists of boxes.
describe("hostile input through task-lists: long runs", () => {
  it.each([
    [`50,000 \`[\``, `- ${`[`.repeat(50_000)}`],
    [`50,000 spaces after the box`, `- [?]${` `.repeat(50_000)}x`],
    [
      `50,000 tabs after the box, then a line ending`,
      `- [?]${`\t`.repeat(50_000)}\nx`
    ],
    [`16,000 boxes in a row`, `- ${`[?]`.repeat(16_000)}`],
    [`20,000 characters after the box`, `- [?] ${`x`.repeat(20_000)}`],
    [`2,000 nested items`, `- [?] a\n  `.repeat(2_000)]
  ])("%s", { timeout: 60_000 }, (_name, input) => {
    const { html, slowest } = measure({}, input);
    expect(html).toStrictEqual(html.map(() => html[0]));
    expect(slowest).toBeLessThan(HOSTILE_TIME_LIMIT);
  });

  it.each([
    [`20,000 items with a box`, `- [?] a\n`],
    [`20,000 done items`, `- [x] a\n`],
    [`20,000 items with a box alone on its line`, `- [?]\n  a\n`],
    [`20,000 such items with CRLF`, `- [?] \r\n  a\r\n`]
  ])("%s", { timeout: 120_000 }, (_name, item) => {
    const { html, slowest } = measure(
      {},
      item.repeat(20_000),
      item.repeat(1_000)
    );
    expect(html).toStrictEqual(html.map(() => html[0]));
    expect(slowest).toBeLessThan(HOSTILE_TIME_LIMIT);
  });
});
