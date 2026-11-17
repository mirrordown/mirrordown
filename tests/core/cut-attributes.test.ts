import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { mirrordown as remarkPreset } from "../../packages/preset-remark/src";
import { mirrordown as satteriPreset } from "../../packages/preset-satteri/src";
import { normalizeHtml } from "../utils/index.js";

const remark = remarkPreset();
const remarkProcessor = unified()
  .use(remarkParse)
  .use(remark.remarkPlugins)
  .use(remarkRehype, remark.remarkRehype)
  .use(remark.rehypePlugins)
  .use(rehypeStringify, { allowDangerousHtml: true });
const satteri = satteriPreset();

// The list in the first panel, where the attribute block ends up.
const firstPanel = (html: string): string =>
  /<section[^>]*>(.*?)<\/section>/s.exec(normalizeHtml(html))?.[1] ?? ``;

// A tab header right after a panel's last paragraph lazily continues it, so Sätteri, which reads attribute blocks before recognition, finds the block mid-paragraph; `placeCutAttributes` places it once the paragraph is cut. A block on its own line, indented to a list item's content, is written inside the item and goes on it. Where that content starts is the marker's to say: a task item's paragraph starts after its `[ ]`, and measured from there the block was read as written outside the item and went on the list.
describe(`placeCutAttributes: an own-line block inside a list item goes on the item`, () => {
  it(`a plain item, as remark places it`, () => {
    const input = `% One\n> - Task\n>   {.a}\n% Two\n> body`;
    const fromSatteri = firstPanel(markdownToHtml(input, satteri).html);
    expect(fromSatteri).toBe(`<ul><li class="a">Task</li></ul>`);
    expect(fromSatteri).toBe(
      firstPanel(String(remarkProcessor.processSync(input)))
    );
  });

  // Only where the block lands is read here; the classes it meets there are the next block's to check.
  it(`a task item, whose paragraph starts right of its content column`, () => {
    const input = `% One\n> - [ ] Task\n>   {.a}\n% Two\n> body`;
    expect(firstPanel(markdownToHtml(input, satteri).html)).toMatch(
      /^<ul class="contains-task-list"><li class="a[ "]/
    );
    expect(firstPanel(String(remarkProcessor.processSync(input)))).toMatch(
      /^<ul class="contains-task-list"><li class="a[ "]/
    );
  });
});

// Sätteri's renderer gives a task item `task-list-item` and its list `contains-task-list`, unless a plugin has set a `className` on the node, which replaces them: a class placed here took the item's own away, and with it the styles that hide its bullet. Outside a panel the parser reads the same block itself and keeps both, as remark does.
describe(`placeCutAttributes: a class placed on a task item or its list keeps the renderer's own`, () => {
  const both = (input: string): string => {
    const fromSatteri = firstPanel(markdownToHtml(input, satteri).html);
    expect(fromSatteri).toBe(
      firstPanel(String(remarkProcessor.processSync(input)))
    );
    return fromSatteri;
  };

  it(`on the item, from a line of its own`, () => {
    expect(both(`% One\n> - [ ] Task\n>   {.a}\n% Two\n> body`)).toBe(
      `<ul class="contains-task-list"><li class="a task-list-item"><input type="checkbox" disabled> Task</li></ul>`
    );
  });

  it(`on the item, from the end of its first line`, () => {
    expect(both(`% One\n> - [x] Task {.a}\n% Two\n> body`)).toBe(
      `<ul class="contains-task-list"><li class="a task-list-item"><input type="checkbox" checked disabled> Task</li></ul>`
    );
  });

  it(`on the list, from a line written outside the item`, () => {
    expect(both(`% One\n> - [ ] Task\n> {.a}\n% Two\n> body`)).toBe(
      `<ul class="a contains-task-list"><li class="task-list-item"><input type="checkbox" disabled> Task</li></ul>`
    );
  });

  it(`an id alone leaves the classes as they were`, () => {
    expect(both(`% One\n> - [ ] Task\n>   {#a}\n% Two\n> body`)).toBe(
      `<ul class="contains-task-list"><li class="task-list-item" id="a"><input type="checkbox" disabled> Task</li></ul>`
    );
  });
});
