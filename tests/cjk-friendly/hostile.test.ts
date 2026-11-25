import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { remarkCjkFriendly } from "../../packages/remd-cjk-friendly/src";
import {
  HOSTILE_TIME_LIMIT,
  comparable,
  hostileCases
} from "../utils/hostile.js";
import { asDel, markdownIt, remark } from "./engines.js";

// Every delimiter the rule reaches, written beside CJK punctuation, through both engines with the plugin and without it: none of it may throw, hang, or make the engines disagree.

const timed = (run: () => void): number => {
  const started = performance.now();
  run();
  return performance.now() - started;
};
// The fastest of three runs: a pause for garbage collection only ever makes one slower.
const fastest = (run: () => void): number =>
  Math.min(timed(run), timed(run), timed(run));

// `grow` marks one delimiter of each code path the plugin changes in markdown-it's growth check: `scanDelims` as emphasis, strikethrough, the span plugins and the script plugins call it.
const delimiters = [
  { name: `strong`, run: `**`, marker: `*`, grow: true },
  { name: `emphasis with underscores`, run: `_`, marker: `_`, grow: false },
  { name: `strikethrough`, run: `~~`, marker: `~`, grow: true },
  { name: `mark`, run: `==`, marker: `=`, grow: true },
  { name: `ins`, run: `++`, marker: `+`, grow: false },
  { name: `del`, run: `--`, marker: `-`, grow: false },
  { name: `spoiler`, run: `||`, marker: `|`, grow: false },
  { name: `subscript`, run: `~`, marker: `~`, grow: true },
  { name: `superscript`, run: `^`, marker: `^`, grow: false }
];

const on = [markdownIt(), remark()];
const off = [markdownIt({ cjk: false }), remark({ cjk: false })];
const render = (input: string): string[] =>
  on.map((engine) => comparable(asDel(engine(input))));

describe.each(delimiters)(
  "hostile input through $name beside CJK punctuation",
  ({ run, marker }) => {
    // The span closes after CJK punctuation and before a letter: the case the amendment exists for.
    const wrap = (text: string): string => `「${run}${text}。${run}テスト」`;
    // The same span where CommonMark closes it too. Pairing many spans in one paragraph costs remark more than linear time with or without the plugin, so the cost of the plugin is measured against the same pairs made without it, not against runs left unpaired.
    const twin = (text: string): string => `(${run}${text}.${run} test)`;
    const twins = hostileCases(twin, marker);

    it.each(
      hostileCases(wrap, marker).map((hostile, i) => ({
        ...hostile,
        baseline: twins[i].input
      }))
    )("$name", { timeout: 60_000 }, ({ input, baseline }) => {
      const without = timed(() => off.forEach((engine) => engine(baseline)));
      let html: string[] = [];
      const withIt = timed(() => {
        html = render(input);
      });
      expect(withIt - without).toBeLessThan(HOSTILE_TIME_LIMIT);
      expect(html[1]).toBe(html[0]);
    });
  }
);

// A long paragraph of runs, each beside CJK punctuation on one side or both, or after a variation selector, so that the amendment decides every one of them.
const shapes = (run: string): string[] => [
  `「${run}`,
  `${run}。`,
  `テ${run}「`,
  `。${run}テ`,
  `。︀${run}テ`
];

describe.each(delimiters)(
  "long runs of $name mixed with CJK punctuation",
  ({ run }) => {
    it.each(shapes(run))("render alike: %j", (shape) => {
      const html = render(shape.repeat(500));
      expect(html[1]).toBe(html[0]);
    });
  }
);

// A limit in milliseconds passes on a fast machine whatever the code does, so growth is checked: four times the repetitions take about four times as long when each run costs the same (2.0 to 5.2 measured across the delimiters), and sixteen when each costs the length of the paragraph.
describe.each(delimiters.filter(({ grow }) => grow))(
  "long runs of $name mixed with CJK punctuation",
  ({ run }) => {
    it(
      "take markdown-it about four times as long four times over",
      { timeout: 120_000 },
      () => {
        const [md] = on;
        const shape = `。${run}テ`;
        const small = shape.repeat(10_000);
        const large = shape.repeat(40_000);
        expect(
          fastest(() => md(large)) / fastest(() => md(small))
        ).toBeLessThan(8);
      }
    );
  }
);

// remark is timed where micromark itself is linear. In one long paragraph micromark pairs emphasis, strikethrough and `~`/`^` in more than linear time with or without the plugin (a paragraph of four times as many `「**` grows 4.8 times at 1,000 against 4,000 without it, 11 for `テ~「`), so those runs are one pair to a paragraph. `==`, `++`, `--` and `||` are paired by one scan of Mirrordown's after parsing, which the plugin changes, so two of them stay in one paragraph (`||` builds two nodes per span); GFM is off for them, since its bare-URL scan is slower than linear on runs of letters and hyphens (`a--b` 40,000 times: 14 times as long as 10,000, without any Mirrordown plugin).
describe("remark grows linearly with the plugin", () => {
  // Parsed only: the plugin is a micromark extension, and turning 50,000 paragraphs into HTML adds seconds that measure nothing of it.
  const parser = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkCjkFriendly);
  it.each([
    [
      `a pair to a paragraph, parsed`,
      `**テ。**テ\n\n`,
      (input: string): unknown => parser.parse(input)
    ],
    [`mark in one paragraph`, `。==テ`, remark({ gfm: false })],
    [`spoiler in one paragraph`, `。||テ`, remark({ gfm: false })]
  ])("%s", { timeout: 120_000 }, (_, shape, rm) => {
    const small = shape.repeat(10_000);
    const large = shape.repeat(40_000);
    expect(timed(() => rm(large)) / timed(() => rm(small))).toBeLessThan(8);
  });
});
