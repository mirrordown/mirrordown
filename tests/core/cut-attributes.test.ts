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

  // Only where the block lands is read here: on the item, Sätteri then renders `class="a"` where remark renders `class="a task-list-item"`, a difference in how a placed class meets the renderer's own, not in placement.
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
