import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { blockIds } from "../../packages/mdit-block-ids/src";
import { remarkBlockIds } from "../../packages/remd-block-ids/src";
import { satteriBlockIds } from "../../packages/sat-block-ids/src";
import {
  HOSTILE_TIME_LIMIT,
  comparable,
  hostileCases
} from "../utils/hostile.js";
import { normalizeHtml } from "../utils/index.js";

// The three engines, with the plugin or without it: the plugin's own cost is the difference.
const pipelines = (on: boolean): Array<(input: string) => string> => {
  const md = new MarkdownIt();
  if (on) md.use(blockIds);
  const processor = unified()
    .use(remarkParse)
    .use(on ? [remarkBlockIds] : [])
    .use(remarkRehype)
    .use(rehypeStringify);
  return [
    (input) => md.render(input),
    (input) => String(processor.processSync(input)),
    (input) =>
      markdownToHtml(input, {
        features: { gfm: false, frontmatter: false, smartPunctuation: false },
        mdastPlugins: on ? [satteriBlockIds()] : []
      }).html
  ];
};
const withPlugin = pipelines(true);
const bare = pipelines(false);

const timed = (run: () => void): number => {
  const started = performance.now();
  run();
  return performance.now() - started;
};

const fails = (run: () => void): boolean => {
  try {
    run();
    return false;
  } catch {
    return true;
  }
};

// How much longer each engine takes with the plugin, rendering `input`, and whether the plugin made it fail. An engine that fails on the input by itself (remark runs out of stack on quotes nested thousands deep) is not timed.
const ownCost = (input: string): { slowest: number; failed: number } => {
  let slowest = 0;
  let failed = 0;
  for (const [index, render] of withPlugin.entries()) {
    let alone = false;
    let broken = false;
    const without = timed(() => {
      alone = fails(() => bare[index]!(input));
    });
    const withIt = timed(() => {
      broken = fails(() => render(input));
    });
    if (broken && !alone) failed++;
    if (!alone) slowest = Math.max(slowest, withIt - without);
  }
  return { slowest, failed };
};

const html = (input: string): string[] =>
  withPlugin.map((render) => comparable(normalizeHtml(render(input))));

// Input an author would never write on purpose still arrives: pasted logs, generated files, text from another system. None of it may throw, hang, or make the engines disagree.
describe("hostile input through block-ids", () => {
  it.each(hostileCases((text) => `${text} ^blk`, `^`))("$name", ({ input }) => {
    const { slowest, failed } = ownCost(input);
    expect(failed).toBe(0);
    expect(slowest).toBeLessThan(HOSTILE_TIME_LIMIT);
    const out = html(input);
    expect(out).toStrictEqual(out.map(() => out[0]));
  });

  // Only the last marker counts, and it is read from the end of the text, so a paragraph of markers costs no more than its last.
  it.each([
    ["on one line", "word ^blk ".repeat(20_000).trimEnd()],
    ["each on a line of its own", "word ^blk\n".repeat(20_000)]
  ])("20,000 markers in one paragraph, %s", { timeout: 60_000 }, (_, input) => {
    const { slowest, failed } = ownCost(input);
    expect(failed).toBe(0);
    expect(slowest).toBeLessThan(HOSTILE_TIME_LIMIT);
    const out = html(input);
    expect(out).toStrictEqual(out.map(() => out[0]));
  });

  // Rule 5 resolves duplicates through maps, and a marker alone looks back past the markers alone before it once, so many of either are linear. Parity is checked on fewer: remark alone takes seconds on tens of thousands of blocks.
  it.each([
    [
      "each paragraph with the same marker",
      (n: number) => "para ^same\n\n".repeat(n)
    ],
    [
      "markers alone after one paragraph",
      (n: number) => `para\n\n${"^m\n\n".repeat(n)}`
    ]
  ])("20,000 blocks: %s", { timeout: 120_000 }, (_, make) => {
    const { slowest, failed } = ownCost(make(20_000));
    expect(failed).toBe(0);
    expect(slowest).toBeLessThan(HOSTILE_TIME_LIMIT);
    const out = html(make(2000));
    expect(out).toStrictEqual(out.map(() => out[0]));
  });

  // The tree is walked with a stack, not recursion: quotes nested as deep as a parser takes them cost no stack. markdown-it stops nesting at its `maxNesting`, so the engines are compared at a depth all three nest to.
  it(
    "20,000 nested quotes with a marker in the innermost",
    { timeout: 60_000 },
    () => {
      const { slowest, failed } = ownCost(`${">".repeat(20_000)} text ^deep`);
      expect(failed).toBe(0);
      expect(slowest).toBeLessThan(HOSTILE_TIME_LIMIT);
      const out = html(`${">".repeat(50)} text ^deep`);
      expect(out[0]).toMatch(/^<blockquote id="\^deep"><blockquote>/);
      expect(out).toStrictEqual(out.map(() => out[0]));
    }
  );

  // Identifiers are keys of a `Map`, never of a plain object, whose inherited members would otherwise answer for them; `_` is not an identifier character, so `^__proto__` is text.
  it("names blocks after members of every object", () => {
    const out = html(
      "a ^constructor\n\nb ^constructor\n\nc ^toString\n\n^hasOwnProperty\n\nd ^__proto__"
    );
    expect(out[0]).toBe(
      '<p>a</p><p id="^constructor">b</p><p id="^hasOwnProperty">c</p><p>d ^<strong>proto</strong></p>'
    );
    expect(out).toStrictEqual(out.map(() => out[0]));
  });
});
