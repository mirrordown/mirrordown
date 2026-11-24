import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { taskLists } from "../../packages/mdit-task-lists/src";
import { attrs } from "../../packages/mdit-attrs/src";
import {
  remarkTaskLists,
  taskListsHastHandlers
} from "../../packages/remd-task-lists/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { satteriTaskLists } from "../../packages/sat-task-lists/src";
import { normalizeHtml } from "../utils/index.js";

type Render = (src: string) => string;

const mdit =
  (md: MarkdownIt): Render =>
  (src) =>
    normalizeHtml(md.render(src));

const remd =
  (gfm: boolean, order: "task-lists first" | "attrs first"): Render =>
  (src) => {
    const plugins =
      order === "task-lists first"
        ? [remarkTaskLists, remarkAttrs]
        : [remarkAttrs, remarkTaskLists];
    return normalizeHtml(
      String(
        unified()
          .use(remarkParse)
          .use(gfm ? [remarkGfm] : [])
          .use(plugins)
          .use(remarkRehype, { handlers: taskListsHastHandlers })
          .use(rehypeStringify)
          .processSync(src)
      )
    );
  };

const sat =
  (gfm: boolean): Render =>
  (src) =>
    normalizeHtml(
      markdownToHtml(src, {
        features: {
          gfm,
          frontmatter: false,
          smartPunctuation: false,
          attributes: true
        },
        mdastPlugins: [satteriTaskLists()]
      }).html
    );

// markdown-it applies attribute blocks after parsing whichever plugin is added first, and Sätteri while it parses. remark runs its plugins in the order given: task-lists first, as the presets list it.
const engines: readonly (readonly [string, Render])[] = [
  ["markdown-it", mdit(new MarkdownIt().use(taskLists).use(attrs))],
  [
    "markdown-it, attrs added first",
    mdit(new MarkdownIt().use(attrs).use(taskLists))
  ],
  ["remark", remd(false, "task-lists first")],
  ["remark with GFM", remd(true, "task-lists first")],
  ["sätteri", sat(false)],
  ["sätteri with GFM", sat(true)]
];

const box = (label?: string, checked = false): string =>
  `<input type="checkbox"${checked ? " checked" : ""} disabled${label ? ` aria-label="${label}"` : ""}>`;

// GFM's engines put a block's classes before the class they give a task and its list, and the task's class before the block's other attributes. Every marker follows them.
describe.each(engines)("task-lists + attrs (%s)", (_engine, render) => {
  it.each([
    [
      "a block at the end of a task's text goes on its item",
      "- [?] a {.cls}",
      `<ul class="contains-task-list"><li class="cls task-list-item" data-task="?">${box("Question")} a</li></ul>`
    ],
    [
      "on a done task too",
      "- [x] a {.cls}",
      `<ul class="contains-task-list"><li class="cls task-list-item">${box(undefined, true)} a</li></ul>`
    ],
    [
      "an id comes after the task's own attributes",
      "- [?] a {#id .cls}",
      `<ul class="contains-task-list"><li class="cls task-list-item" data-task="?" id="id">${box("Question")} a</li></ul>`
    ],
    [
      "an id on a done task",
      "- [x] a {#id .cls}",
      `<ul class="contains-task-list"><li class="cls task-list-item" id="id">${box(undefined, true)} a</li></ul>`
    ],
    [
      "another attribute",
      "- [?] a {data-x=1}",
      `<ul class="contains-task-list"><li class="task-list-item" data-task="?" data-x="1">${box("Question")} a</li></ul>`
    ],
    [
      // The author's value wins, once: a second `data-task` would be invalid HTML, of which browsers read the first.
      "a `data-task` the author writes replaces the marker's",
      "- [?] a {data-task=z}",
      `<ul class="contains-task-list"><li class="task-list-item" data-task="z">${box("Question")} a</li></ul>`
    ],
    [
      "a block on the line after the list goes on the list",
      "- [?] a\n{.cls}",
      `<ul class="cls contains-task-list"><li class="task-list-item" data-task="?">${box("Question")} a</li></ul>`
    ],
    [
      "on an ordered list, after its start",
      "3. [?] a\n{.cls}",
      `<ol start="3" class="cls contains-task-list"><li class="task-list-item" data-task="?">${box("Question")} a</li></ol>`
    ],
    [
      "a block after an element in the text goes on the element",
      "- [?] *a*{.e} b",
      `<ul class="contains-task-list"><li class="task-list-item" data-task="?">${box("Question")} <em class="e">a</em> b</li></ul>`
    ],
    [
      "a block before the box leaves it text",
      "- {.cls} [?] a",
      "<ul><li>{.cls} [?] a</li></ul>"
    ]
  ])("%s", (_name, input, expected) => {
    expect(render(input)).toBe(expected);
  });
});

// Engine limit (Sätteri). Its parser takes an attribute block off the item while it parses, before any plugin runs, so when the block is all the item holds after the box, the plugin sees a box with nothing after it, which is text. Sätteri's own GFM reads `[x]` while it parses too, before the block is taken.
describe("task-lists + attrs, engine limit: a box followed only by a block", () => {
  const [[, md], [, mdAttrsFirst], [, rm], [, rmGfm], [, st], [, stGfm]] =
    engines;

  it.each([
    ["markdown-it", md],
    ["markdown-it, attrs added first", mdAttrsFirst],
    ["remark", rm],
    ["remark with GFM", rmGfm]
  ] as const)("%s reads a task with no text", (_engine, render) => {
    expect(render("- [?] {.cls}")).toBe(
      `<ul class="contains-task-list"><li class="cls task-list-item" data-task="?">${box("Question")} </li></ul>`
    );
  });

  it("sätteri leaves the box text", () => {
    for (const render of [st, stGfm]) {
      expect(render("- [?] {.cls}")).toBe('<ul><li class="cls">[?]</li></ul>');
    }
    expect(st("- [x] {.cls}")).toBe('<ul><li class="cls">[x]</li></ul>');
    expect(stGfm("- [x] {.cls}")).toBe(
      `<ul class="contains-task-list"><li class="cls task-list-item">${box(undefined, true)} </li></ul>`
    );
  });
});

// remark-attrs gives a task's item and list their classes in GFM's order only when it can tell they are a task's, which it reads from `checked`: list it after task-lists, as the presets do. Before it, it writes the block's class as an attribute of its own beside the task's, which browsers read only the first of.
describe("task-lists + attrs: the order of the remark plugins", () => {
  it("attrs listed first writes a second class attribute", () => {
    const html = remd(false, "attrs first")("- [?] a {.cls}");
    expect(html.match(/ class=/g)).toHaveLength(3);
    expect(html).not.toContain('class="cls task-list-item"');
  });
});
