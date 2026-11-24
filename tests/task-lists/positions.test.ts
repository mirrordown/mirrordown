import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root } from "mdast";
import { visit } from "unist-util-visit";
import { defineMdastPlugin, markdownToHtml } from "satteri";
import { textEscapes } from "../../packages/core/src";
import { remarkTaskLists } from "../../packages/remd-task-lists/src";
import { satteriTaskLists } from "../../packages/sat-task-lists/src";

// The inline plugins after this one (mark, del, kbd and the rest) read which characters of a text were escaped from where the text sits in the source. Taking the box off the front of the text must move its start too, or they read the escapes of the wrong characters (here the second or the fourth `=` instead of the first). markdown-it keeps an escape as a token of its own, so it has nothing to line up.
const cases = [
  ["after a space", "- [?] \\==a== ==b=="],
  ["after a line ending", "- [?]\n  \\==a== ==b=="],
  ["after a marker that is a delimiter", "- [=] \\==a== ==b=="]
] as const;

const escapesAfterRemark = (source: string, gfm: boolean): number[][] => {
  const processor = unified()
    .use(remarkParse)
    .use(gfm ? [remarkGfm] : [])
    .use(remarkTaskLists, { fallback: true });
  const tree: Root = processor.runSync(processor.parse(source), source);
  const found: number[][] = [];
  visit(tree, "text", (node) => {
    found.push([...textEscapes(node, source)]);
  });
  return found;
};

const escapesAfterSatteri = (source: string, gfm: boolean): number[][] => {
  const found: number[][] = [];
  const spy = (ctx: { source: string }) =>
    defineMdastPlugin({
      name: "spy",
      options: { position: true },
      text(node) {
        if (node.value !== " ") found.push([...textEscapes(node, ctx.source)]);
      }
    });
  markdownToHtml(source, {
    features: { gfm, frontmatter: false, smartPunctuation: false },
    mdastPlugins: [satteriTaskLists({ fallback: true }), spy]
  });
  return found;
};

describe.each([
  ["remark", escapesAfterRemark],
  ["sätteri", escapesAfterSatteri]
] as const)("task-lists: the text after the box (%s)", (_engine, escapes) => {
  it.each(cases)("keeps its escapes %s", (_case, source) => {
    expect(escapes(source, false)).toStrictEqual([[0]]);
    expect(escapes(source, true)).toStrictEqual([[0]]);
  });
});
