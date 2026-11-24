import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import type { MarkOptions } from "../../packages/core/src";
import { mark } from "../../packages/mdit-mark/src";
import { remarkMark } from "../../packages/remd-mark/src";
import { satteriMark } from "../../packages/sat-mark/src";
import { normalizeHtml } from "../utils/index.js";
import { HOSTILE_TIME_LIMIT } from "../utils/hostile.js";

// The `markers` option: a site's own markers merged over the defaults, in all three engines. Each builder creates its plugin at once, so a bad option throws where the plugin is set up: markdown-it's `use`, Sätteri's factory, and unified's `freeze`, which calls remark's attacher.

const SELECTOR = "\u{FE0F}";
const WARNING = "\u{26A0}"; // ⚠, without its selector
const ROCKET = "\u{1F680}"; // 🚀
const BUG = "\u{1F41B}"; // 🐛
const RED = "\u{1F534}"; // 🔴
const DEVELOPER = "\u{1F469}\u{200D}\u{1F4BB}"; // 👩‍💻, a ZWJ sequence
const WOMAN = "\u{1F469}"; // 👩
const RAINBOW_FLAG = "\u{1F3F3}\u{FE0F}\u{200D}\u{1F308}"; // 🏳️‍🌈, a selector inside a ZWJ sequence
const JAPAN = "\u{1F1EF}\u{1F1F5}"; // 🇯🇵, a flag
const JAMAICA = "\u{1F1EF}\u{1F1F2}"; // 🇯🇲, a flag that shares its first code point

const satFeatures = { gfm: false, frontmatter: false, smartPunctuation: false };

type Render = (input: string) => string;
type Build = (options?: MarkOptions) => Render;

const engines: [name: string, build: Build][] = [
  [
    "markdown-it",
    (options) => {
      const md = new MarkdownIt().use(mark, options);
      return (input) => normalizeHtml(md.render(input));
    }
  ],
  [
    "remark",
    (options) => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkMark, options)
        .use(remarkRehype)
        .use(rehypeStringify)
        .freeze();
      return (input) => normalizeHtml(String(processor.processSync(input)));
    }
  ],
  [
    "sätteri",
    (options) => {
      const plugin = satteriMark(options);
      return (input) =>
        normalizeHtml(
          markdownToHtml(input, {
            features: satFeatures,
            mdastPlugins: [plugin]
          }).html
        );
    }
  ]
];

type Case = [
  name: string,
  markers: NonNullable<MarkOptions["markers"]>,
  input: string,
  expected: string
];

const cases: Case[] = [
  [
    "a marker given as a string names its variant and keeps its emoji",
    { [ROCKET]: "release" },
    `==${ROCKET} Ship==`,
    `<p><mark data-highlight="release">${ROCKET} Ship</mark></p>`
  ],
  [
    "a marker given as an object keeps its emoji unless told not to",
    { [ROCKET]: { name: "release" } },
    `==${ROCKET} Ship==`,
    `<p><mark data-highlight="release">${ROCKET} Ship</mark></p>`
  ],
  [
    "a marker given with keep: false is removed, and only it",
    { [ROCKET]: { name: "release", keep: false } },
    `==${ROCKET} Ship== ==${ROCKET}==`,
    `<p><mark data-highlight="release"> Ship</mark> <mark data-highlight="release"></mark></p>`
  ],
  [
    "a default turned off is text again, and the others still count",
    { [BUG]: false },
    `==${BUG} Bug== ==${RED}red==`,
    `<p><mark>${BUG} Bug</mark> <mark data-highlight="red">red</mark></p>`
  ],
  [
    "a colour turned off leaves its square",
    { [RED]: false },
    `==${RED}circle== ==\u{1F7E5}square==`,
    `<p><mark>${RED}circle</mark> <mark data-highlight="red">square</mark></p>`
  ],
  [
    "the warning sign turned off by its key without the selector",
    { [WARNING]: false },
    `==${WARNING}${SELECTOR} a== ==${WARNING} b==`,
    `<p><mark>${WARNING}${SELECTOR} a</mark> <mark>${WARNING} b</mark></p>`
  ],
  [
    "the warning sign turned off by its key with the selector",
    { [`${WARNING}${SELECTOR}`]: false },
    `==${WARNING}${SELECTOR} a== ==${WARNING} b==`,
    `<p><mark>${WARNING}${SELECTOR} a</mark> <mark>${WARNING} b</mark></p>`
  ],
  [
    "a default renamed with a string keeps its emoji",
    { [BUG]: "defect" },
    `==${BUG} Bug==`,
    `<p><mark data-highlight="defect">${BUG} Bug</mark></p>`
  ],
  [
    "a colour renamed with a string keeps its emoji, as any string does",
    { [RED]: "danger" },
    `==${RED} Stop==`,
    `<p><mark data-highlight="danger">${RED} Stop</mark></p>`
  ],
  [
    "a colour renamed with keep: false still loses it",
    { [RED]: { name: "danger", keep: false } },
    `==${RED} Stop==`,
    `<p><mark data-highlight="danger"> Stop</mark></p>`
  ],
  [
    "a label given keep: false loses its emoji",
    { [BUG]: { name: "bug", keep: false } },
    `==${BUG} Bug==`,
    `<p><mark data-highlight="bug"> Bug</mark></p>`
  ],
  [
    "a removed marker keyed without the selector leaves the text's selector",
    { [WARNING]: { name: "caution", keep: false } },
    `==${WARNING}${SELECTOR} a== ==${WARNING} b==`,
    `<p><mark data-highlight="caution">${SELECTOR} a</mark> <mark data-highlight="caution"> b</mark></p>`
  ],
  [
    "a removed marker keyed with the selector takes one selector, when the text has it",
    { [`${WARNING}${SELECTOR}`]: { name: "caution", keep: false } },
    `==${WARNING}${SELECTOR} a== ==${WARNING} b== ==${WARNING}${SELECTOR}${SELECTOR} c==`,
    `<p><mark data-highlight="caution"> a</mark> <mark data-highlight="caution"> b</mark> <mark data-highlight="caution">${SELECTOR} c</mark></p>`
  ],
  [
    "a removed marker leaves a selector written as a character reference",
    { [`${WARNING}${SELECTOR}`]: { name: "caution", keep: false } },
    `==${WARNING}&#xFE0F; a==`,
    `<p><mark data-highlight="caution">${SELECTOR} a</mark></p>`
  ],
  [
    "a ZWJ sequence is one marker, and the emoji it starts with is not it",
    { [DEVELOPER]: "dev" },
    `==${DEVELOPER} Ana== ==${WOMAN} Eve==`,
    `<p><mark data-highlight="dev">${DEVELOPER} Ana</mark> <mark>${WOMAN} Eve</mark></p>`
  ],
  [
    "a removed ZWJ sequence goes whole",
    { [DEVELOPER]: { name: "dev", keep: false } },
    `==${DEVELOPER}Ana==`,
    `<p><mark data-highlight="dev">Ana</mark></p>`
  ],
  [
    "a ZWJ sequence with a selector inside matches with or without it",
    { [RAINBOW_FLAG]: { name: "pride", keep: false } },
    `==${RAINBOW_FLAG} a== ==${RAINBOW_FLAG.replace(SELECTOR, "")} b==`,
    `<p><mark data-highlight="pride"> a</mark> <mark data-highlight="pride"> b</mark></p>`
  ],
  [
    "a ZWJ written as a character reference breaks the sequence",
    { [DEVELOPER]: "dev" },
    `==${WOMAN}&zwj;\u{1F4BB} Ana==`,
    `<p><mark>${DEVELOPER} Ana</mark></p>`
  ],
  [
    "a flag is one marker, and another flag with the same first letter is not it",
    { [JAPAN]: { name: "ja", keep: false } },
    `==${JAPAN}\u{3053}\u{3093}== ==${JAMAICA} Kingston==`,
    `<p><mark data-highlight="ja">\u{3053}\u{3093}</mark> <mark>${JAMAICA} Kingston</mark></p>`
  ],
  [
    "of two markers where one starts the other, the longest that matches wins",
    { [ROCKET]: "release", [ROCKET.repeat(2)]: "major" },
    `==${ROCKET} a== ==${ROCKET.repeat(2)} b== ==${ROCKET.repeat(3)} c==`,
    `<p><mark data-highlight="release">${ROCKET} a</mark> <mark data-highlight="major">${ROCKET.repeat(2)} b</mark> <mark data-highlight="major">${ROCKET.repeat(3)} c</mark></p>`
  ],
  [
    "the longest wins whichever key comes first",
    { [ROCKET.repeat(2)]: "major", [ROCKET]: "release" },
    `==${ROCKET} a== ==${ROCKET.repeat(2)} b==`,
    `<p><mark data-highlight="release">${ROCKET} a</mark> <mark data-highlight="major">${ROCKET.repeat(2)} b</mark></p>`
  ],
  [
    "a longer marker over a default colour takes all of itself",
    { [RED.repeat(2)]: { name: "alarm", keep: false } },
    `==${RED.repeat(2)} a== ==${RED} b==`,
    `<p><mark data-highlight="alarm"> a</mark> <mark data-highlight="red"> b</mark></p>`
  ],
  [
    "a variant named after an object member is a name like any other",
    { [ROCKET]: "constructor", [BUG]: "__proto__" },
    `==${ROCKET} a== ==${BUG} b==`,
    `<p><mark data-highlight="constructor">${ROCKET} a</mark> <mark data-highlight="__proto__">${BUG} b</mark></p>`
  ],
  [
    "a marker named after an object member matches only itself",
    { constructor: "c" },
    `==constructor a== ==toString b==`,
    `<p><mark data-highlight="c">constructor a</mark> <mark>toString b</mark></p>`
  ],
  [
    "a variant name may be in any script",
    { [ROCKET]: "\u{7248}\u{672C}" },
    `==${ROCKET} a==`,
    `<p><mark data-highlight="\u{7248}\u{672C}">${ROCKET} a</mark></p>`
  ],
  [
    "a marker may be text, not only an emoji",
    { "NB:": "note" },
    `==NB: read this==`,
    `<p><mark data-highlight="note">NB: read this</mark></p>`
  ],
  [
    "a replacement pattern after a removed marker stays as written",
    { [ROCKET]: { name: "release", keep: false } },
    `==${ROCKET}$&$$$'==`,
    `<p><mark data-highlight="release">$&amp;$$$'</mark></p>`
  ],
  [
    "one key given twice, with and without its selector: the later wins",
    { [WARNING]: "first", [`${WARNING}${SELECTOR}`]: "second" },
    `==${WARNING} a==`,
    `<p><mark data-highlight="second">${WARNING} a</mark></p>`
  ]
];

// What a caller without the types may pass, so the checks at setup are what stops it.
const invalid: [name: string, markers: Record<string, unknown>][] = [
  ["a variant name with a space", { [ROCKET]: "two words" }],
  ["an empty variant name", { [ROCKET]: "" }],
  ["a variant name with markup", { [ROCKET]: "<b>" }],
  ["a variant name with a quote", { [ROCKET]: { name: 'a"b' } }],
  ["an object without a name", { [ROCKET]: { keep: false } }],
  ["true in place of a name", { [ROCKET]: true }],
  ["null in place of a name", { [ROCKET]: null }],
  ["an empty key", { "": "empty" }],
  ["a key with a space", { [`${ROCKET} `]: "release" }],
  ["a key with a space inside", { "a b": "ab" }],
  ["a key of only a variation selector", { [SELECTOR]: "selector" }]
];

describe.each(engines)("mark markers option (%s)", (_engine, build) => {
  it.each(cases)("%s", (_name, markers, input, expected) => {
    expect(build({ markers })(input)).toBe(expected);
  });

  it.each(invalid)("throws at setup for %s", (_name, markers) => {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const options = { markers } as MarkOptions;
    expect(() => build(options)).toThrow(TypeError);
    expect(() => build(options)).toThrow(/^mark: the marker /);
  });

  // An options object is often a shared constant. Freezing it makes any write throw, and the second plugin built from it must render as the first.
  it("leaves the options it is given untouched, for a second plugin to use", () => {
    const markers = {
      [ROCKET]: "release",
      [BUG]: { name: "defect", keep: false },
      [RED]: false
    } as const;
    const options: MarkOptions = Object.freeze({
      markers: Object.freeze({
        ...markers,
        [BUG]: Object.freeze({ ...markers[BUG] })
      })
    });
    const input = `==${ROCKET} a== ==${BUG} b== ==${RED} c==`;
    const expected = `<p><mark data-highlight="release">${ROCKET} a</mark> <mark data-highlight="defect"> b</mark> <mark>${RED} c</mark></p>`;
    const first = build(options);
    expect(first(input)).toBe(expected);
    expect(build(options)(input)).toBe(expected);
    expect(options).toStrictEqual({ markers });
  });

  it("does not carry one plugin's markers into another's", () => {
    const withRocket = build({ markers: { [ROCKET]: "release" } });
    const plain = build();
    expect(withRocket(`==${ROCKET} a==`)).toBe(
      `<p><mark data-highlight="release">${ROCKET} a</mark></p>`
    );
    expect(plain(`==${ROCKET} a==`)).toBe(`<p><mark>${ROCKET} a</mark></p>`);
  });
});

describe.each(engines)("mark markers on long input (%s)", (_engine, build) => {
  // Reading a marker must not restart at each emoji of a run, and many markers must not be tried one by one. Each case is timed against the same work without a marker (an ant, an emoji of the same length that is not one, or no option), so what is measured is the markers' own cost.
  const ANT = "\u{1F41C}";
  const timed = (run: () => unknown): number => {
    const started = performance.now();
    run();
    return performance.now() - started;
  };

  it.each([
    [
      "a highlight of 20,000 labels takes the variant of the first and keeps them all",
      `==${BUG.repeat(20_000)}==`,
      `<p><mark data-highlight="bug">${BUG.repeat(20_000)}</mark></p>`
    ],
    [
      "a label followed by 20,000 variation selectors",
      `==${BUG}${SELECTOR.repeat(20_000)}==`,
      `<p><mark data-highlight="bug">${BUG}${SELECTOR.repeat(20_000)}</mark></p>`
    ]
  ])("%s", (_name, input, expected) => {
    const render = build();
    const plain = timed(() => render(input.replaceAll(BUG, ANT)));
    expect(timed(() => render(input)) - plain).toBeLessThan(HOSTILE_TIME_LIMIT);
    expect(render(input)).toBe(expected);
  });

  it("an option of 2,000 markers over a document of 2,000 highlights", () => {
    const keys = Array.from({ length: 2_000 }, (_, i) =>
      String.fromCodePoint(0x4e00 + i)
    );
    const markers = Object.fromEntries(keys.map((key, i) => [key, `v${i}`]));
    const input = keys.map((key) => `==${key}x==`).join(" ");
    const expected = `<p>${keys
      .map((key, i) => `<mark data-highlight="v${i}">${key}x</mark>`)
      .join(" ")}</p>`;
    const plain = timed(() => build()(input));
    let html = "";
    const elapsed = timed(() => {
      html = build({ markers })(input);
    });
    expect(elapsed - plain).toBeLessThan(HOSTILE_TIME_LIMIT);
    expect(html).toBe(expected);
  });
});
