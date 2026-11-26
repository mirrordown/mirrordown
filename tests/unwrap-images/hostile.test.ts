import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { attrs } from "../../packages/mdit-attrs/src";
import { blockIds } from "../../packages/mdit-block-ids/src";
import { lightbox } from "../../packages/mdit-lightbox/src";
import { unwrapImages } from "../../packages/mdit-unwrap-images/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { remarkBlockIds } from "../../packages/remd-block-ids/src";
import { rehypeLightbox } from "../../packages/remd-lightbox/src";
import { rehypeUnwrapImages } from "../../packages/remd-unwrap-images/src";
import { satteriBlockIds } from "../../packages/sat-block-ids/src";
import { satteriLightbox } from "../../packages/sat-lightbox/src";
import { satteriUnwrapImages } from "../../packages/sat-unwrap-images/src";
import {
  comparable,
  GROWTH_CHECK,
  HOSTILE_TIME_LIMIT,
  hostileCases
} from "../utils/hostile.js";
import { normalizeHtml } from "../utils/index.js";

// The three engines with the plugins that give a paragraph attributes and the lightbox, with unwrap-images or without it: the plugin's own cost is the difference.
const pipelines = (on: boolean): ((input: string) => string)[] => {
  const md = new MarkdownIt().use(attrs).use(blockIds).use(lightbox);
  if (on) md.use(unwrapImages);
  const processor = unified()
    .use(remarkParse)
    .use(remarkAttrs)
    .use(remarkBlockIds)
    .use(remarkRehype)
    .use(rehypeLightbox)
    .use(on ? [rehypeUnwrapImages] : [])
    .use(rehypeStringify);
  return [
    (input) => md.render(input),
    (input) => String(processor.processSync(input)),
    (input) =>
      markdownToHtml(input, {
        features: {
          gfm: false,
          attributes: true,
          frontmatter: false,
          smartPunctuation: false
        },
        mdastPlugins: [satteriBlockIds()],
        hastPlugins: on
          ? [satteriLightbox(), satteriUnwrapImages()]
          : [satteriLightbox()]
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

const MDIT = 0;
const SAT = 2;

// remark's pipeline here takes seconds on tens of thousands of paragraphs, and the difference between two such runs is mostly what else the machine was doing: on a CI runner it came to more than the limit with nothing wrong. So remark's plugin is timed on its transform alone, on the tree the rest of the pipeline hands it.
const remarkBare = unified()
  .use(remarkParse)
  .use(remarkAttrs)
  .use(remarkBlockIds)
  .use(remarkRehype)
  .use(rehypeLightbox);
const remarkUnwrap = unified().use(rehypeUnwrapImages);
const remarkCost = (input: string): number => {
  const tree = remarkBare.runSync(remarkBare.parse(input));
  return timed(() => remarkUnwrap.runSync(tree));
};

// How much the plugin costs the slowest engine, rendering `input`: for markdown-it and Sätteri, how much longer the pipeline takes with it than without, each at its fastest.
const ownCost = (input: string): number =>
  Math.max(
    remarkCost(input),
    ...[MDIT, SAT].map(
      (index) =>
        fastest(() => withPlugin[index](input)) -
        fastest(() => bare[index](input))
    )
  );

const html = (input: string): string[] =>
  withPlugin.map((render) => comparable(normalizeHtml(render(input))));

const three = (out: string): string[] => [out, out, out];

// Input an author would never write on purpose still arrives. None of it may throw, hang, or make the engines disagree. The text stands beside an image in a paragraph that has attributes, from an attribute block or from a marker, which is where the plugin reads it: only whitespace there lets the paragraph go.
describe("hostile input through unwrap-images", () => {
  describe.each([
    ["an attribute block", (text: string) => `![a](pic.png) ${text}\n{#x .c}`],
    ["a marker", (text: string) => `![a](pic.png) ${text} ^img`]
  ])("with %s", (_, wrap) => {
    it.each(hostileCases(wrap, `!`))("$name", ({ input }) => {
      expect(ownCost(input)).toBeLessThan(HOSTILE_TIME_LIMIT);
      const out = html(input);
      expect(out).toStrictEqual(out.map(() => out[0]));
    });
  });

  // A paragraph's attributes are read as entries and the image's are found by name, never through a plain object's keys, so a name that is a member of every object is an attribute like any other, and a value is never a replacement pattern. A backtick is left out: the serializers spell it differently in an attribute value (`&#x60;` in hast), whatever the plugins do.
  it("moves attributes named after members of every object", () => {
    expect(
      html(
        "![a](pic.png){toString=own}\n{toString=para hasOwnProperty=h data-k=$& title=$$ data-j=$1 data-l=$'}"
      )
    ).toStrictEqual(
      three(
        `<img src="pic.png" alt="a" toString="own" hasOwnProperty="h" data-k="$&amp;" title="$$" data-j="$1" data-l="$'">`
      )
    );
  });

  // A paragraph's spaces between images, and its classes, are each read once.
  it.each([
    [
      "spaces between two images, with an id",
      `![a](a.png)${" ".repeat(20_000)}![b](b.png)\n{#x}`
    ],
    [
      "spaces between two images, with none",
      `![a](a.png)${" ".repeat(20_000)}![b](b.png)`
    ],
    [
      "classes on the image and the paragraph",
      `![a](pic.png){${".c ".repeat(20_000)}}\n{${".c .d ".repeat(20_000)}}`
    ]
  ])("a long run of %s", (_, input) => {
    expect(ownCost(input)).toBeLessThan(HOSTILE_TIME_LIMIT);
    const out = html(input);
    expect(out).toStrictEqual(out.map(() => out[0]));
  });

  // Line endings other than `\n` end the image's line and the attribute block's.
  it.each([
    ["CRLF", "\r\n"],
    ["a lone CR", "\r"]
  ])("moves the attributes with %s line endings", (_, eol) => {
    expect(
      html(`![a](pic.png)${eol}{#hero .wide}${eol}${eol}![b](b.png) ^b${eol}`)
    ).toStrictEqual(
      three(
        '<img src="pic.png" alt="a" id="hero" class="wide"><img src="b.png" alt="b" id="^b">'
      )
    );
  });

  // A paragraph is scanned once for its images, and only a paragraph with one image is rebuilt, so neither many images in one paragraph nor many named image paragraphs cost more than their number. Parity is checked on fewer: remark alone takes seconds on tens of thousands of images. Attribute blocks are fewer still: markdown-it's attrs alone takes seconds on 10,000 paragraphs that end in one.
  it.each([
    [
      "one paragraph of 20,000 images, with an id",
      (n: number) => `${"![a](a.png) ".repeat(n)}\n{#x}`,
      20_000
    ],
    [
      "20,000 image paragraphs, each with a marker",
      (n: number) => "![a](a.png) ^m\n\n".repeat(n),
      20_000
    ],
    [
      "5,000 image paragraphs, each with an attribute block",
      (n: number) => "![a](a.png)\n{.c}\n\n".repeat(n),
      5000
    ]
  ])("%s", { timeout: 120_000 }, (_, make, n) => {
    expect(ownCost(make(n))).toBeLessThan(HOSTILE_TIME_LIMIT);
    const out = html(make(n / 10));
    expect(out).toStrictEqual(out.map(() => out[0]));
  });

  // A limit in milliseconds is passed by a fast machine whatever the plugin does, and it was: markdown-it's plugin put each paragraph's children in its place with a splice, which moved every later token once per paragraph, and only a slower machine took more than the limit. Growth does not depend on the machine: four times as many paragraphs take four times as long when the cost is per paragraph, and about twelve times as long with that splice. The sizes are far apart on purpose: between twice as many, the two answers are 2 and 3.5, and a busy machine measured 3.1 for the first.
  it(
    "four times as many image paragraphs take markdown-it about four times as long",
    GROWTH_CHECK,
    () => {
      const render = withPlugin[MDIT];
      const time = (n: number): number => {
        const input = "![a](a.png) ^m\n\n".repeat(n);
        return fastest(() => render(input));
      };
      expect(time(40_000) / time(10_000)).toBeLessThan(8);
    }
  );
});
