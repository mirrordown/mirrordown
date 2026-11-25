import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import type { Root } from "mdast";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { VFile } from "vfile";
import { cjkBreaks } from "../../packages/mdit-cjk-breaks/src";
import { remarkCjkBreaks } from "../../packages/remd-cjk-breaks/src";
import { satteriCjkBreaks } from "../../packages/sat-cjk-breaks/src";
import { HOSTILE_TIME_LIMIT, comparable } from "../utils/hostile.js";

// Every break is decided by looking at most as far as the line next to it, and the removed ones go in one pass over each text node or token list, so the plugin's cost is the number of lines, whatever they hold.
const pipelines = (on: boolean): ((input: string) => string)[] => {
  const md = new MarkdownIt();
  if (on) md.use(cjkBreaks);
  const processor = unified()
    .use(remarkParse)
    .use(on ? [remarkCjkBreaks] : [])
    .use(remarkRehype)
    .use(rehypeStringify);
  return [
    (input) => md.render(input),
    (input) => String(processor.processSync(input)),
    (input) =>
      markdownToHtml(input, {
        features: { gfm: false, frontmatter: false, smartPunctuation: false },
        mdastPlugins: on ? [satteriCjkBreaks()] : []
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

// The fastest of three runs: a pause for garbage collection only ever makes one slower.
const fastest = (run: () => void): number =>
  Math.min(timed(run), timed(run), timed(run));

const lines = (line: string) => (count: number) =>
  `${line}\n`.repeat(count).trimEnd();

// `size` lines for the time limit and parity, and `small` against four times `small` for growth.
const shapes = [
  // Every break removed: the whole paragraph is one text node in remark and Sätteri, rebuilt once.
  {
    name: `one-character CJK lines`,
    make: lines(`日`),
    size: 20_000,
    small: 10_000
  },
  // No break removed.
  {
    name: `one-character Latin lines`,
    make: lines(`a`),
    size: 20_000,
    small: 10_000
  },
  // Every break is a text node of its own between two emphasis nodes, read through and taken out. Fewer lines: remark and Sätteri's own parsing of this much emphasis is what takes the time.
  {
    name: `CJK lines in emphasis`,
    make: lines(`*日*`),
    size: 5000,
    small: 2500
  }
];

describe(`cjk-breaks on hostile input`, () => {
  it.each(shapes)(
    `a paragraph of $size $name`,
    { timeout: 120_000 },
    ({ make, size }) => {
      const input = make(size);
      const html: string[] = [];
      for (const [engine, render] of withPlugin.entries()) {
        const without = timed(() => bare[engine](input));
        const own = timed(() => html.push(comparable(render(input)).trimEnd()));
        expect(own - without).toBeLessThan(HOSTILE_TIME_LIMIT);
      }
      expect(html).toStrictEqual(html.map(() => html[0]));
    }
  );

  // A limit in milliseconds is passed by a fast machine whatever the plugin does. Growth does not depend on the machine: four times as many lines take about four times as long when the cost is per line, and sixteen times as long when each line costs the length of the paragraph.
  describe.each(shapes)(`four times as many $name`, ({ make, small }) => {
    it(
      `take markdown-it about four times as long`,
      { timeout: 120_000 },
      () => {
        const render = withPlugin[0];
        const few = make(small);
        const many = make(small * 4);
        expect(
          fastest(() => render(many)) / fastest(() => render(few))
        ).toBeLessThan(8);
      }
    );

    // remark itself is timed out: its parser takes most of the time and varies most, so the plugin runs alone on a parsed tree. Alone it takes two to four milliseconds on `small` lines, too little to time while the rest of the suite runs beside it (the ratio went past 8 in a full run though the cost is per line), so its two sizes are four times the others', and it takes the fastest of five.
    it(
      `take remark's plugin about four times as long`,
      { timeout: 120_000 },
      () => {
        const parser = unified().use(remarkParse);
        const transform = unified().use(remarkCjkBreaks);
        const time = (input: string): number => {
          const tree = parser.parse(input);
          const file = new VFile(input);
          const trees = [0, 1, 2, 3, 4].map((): Root => structuredClone(tree));
          return Math.min(
            ...trees.map((copy) => timed(() => transform.runSync(copy, file)))
          );
        };
        expect(time(make(small * 16)) / time(make(small * 4))).toBeLessThan(8);
      }
    );

    it(`take Sätteri about four times as long`, { timeout: 120_000 }, () => {
      const render = withPlugin[2];
      const few = make(small);
      const many = make(small * 4);
      expect(
        fastest(() => render(many)) / fastest(() => render(few))
      ).toBeLessThan(8);
    });
  });
});
