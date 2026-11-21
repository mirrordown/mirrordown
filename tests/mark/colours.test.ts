import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified, type PluggableList } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { del } from "../../packages/mdit-del/src";
import { ins } from "../../packages/mdit-ins/src";
import { kbd } from "../../packages/mdit-kbd/src";
import { mark } from "../../packages/mdit-mark/src";
import { spoiler } from "../../packages/mdit-spoiler/src";
import { remarkDel } from "../../packages/remd-del/src";
import { remarkIns } from "../../packages/remd-ins/src";
import { remarkKbd } from "../../packages/remd-kbd/src";
import { remarkMark } from "../../packages/remd-mark/src";
import {
  remarkSpoiler,
  spoilerHastHandlers
} from "../../packages/remd-spoiler/src";
import { satteriDel } from "../../packages/sat-del/src";
import { satteriIns } from "../../packages/sat-ins/src";
import { satteriKbd } from "../../packages/sat-kbd/src";
import { satteriMark } from "../../packages/sat-mark/src";
import { satteriSpoiler } from "../../packages/sat-spoiler/src";
import { normalizeHtml } from "../utils/index.js";
import { HOSTILE_TIME_LIMIT } from "../utils/hostile.js";

// Highlight colours (`==🔴text==`) beside the sets the presets run with mark, and on input a fixture file cannot hold: carriage returns, and runs long enough to show a scan that is not linear.

const RED = "\u{1F534}";
const GREEN = "\u{1F7E2}";

const satFeatures = { gfm: false, frontmatter: false, smartPunctuation: false };

const markOnly = new MarkdownIt().use(mark);
const remarkMarkOnly = unified()
  .use(remarkParse)
  .use(remarkMark)
  .use(remarkRehype)
  .use(rehypeStringify);

const engines = [
  ["markdown-it", (input: string) => normalizeHtml(markOnly.render(input))],
  [
    "remark",
    (input: string) => normalizeHtml(String(remarkMarkOnly.processSync(input)))
  ],
  [
    "sätteri",
    (input: string) =>
      normalizeHtml(
        markdownToHtml(input, {
          features: satFeatures,
          mdastPlugins: [satteriMark()]
        }).html
      )
  ]
] as const;

type Case = [name: string, input: string, expected: string];

const SPOILER = (content: string): string =>
  `<label class="markdown-spoiler"><input type="checkbox" class="markdown-spoiler-toggle" aria-label="spoiler"><span class="markdown-spoiler-content">${content}</span></label>`;

describe("highlight colours beside the other span sets: the colour is the highlight's own first character", () => {
  // The presets run kbd, del, ins, mark and spoiler together. A span another set builds is a node like any other: as the highlight's first child it is not text, so it colours nothing, and inside one the colour is read as usual.
  const cases: Case[] = [
    [
      "a key after the marker",
      `==${RED}[[K]]==`,
      `<p><mark data-highlight="red"><kbd>K</kbd></mark></p>`
    ],
    [
      "a marker inside a key",
      `==[[${RED}]]==`,
      `<p><mark><kbd>${RED}</kbd></mark></p>`
    ],
    [
      "a coloured highlight inside del",
      `--==${RED}x==--`,
      `<p><del><mark data-highlight="red">x</mark></del></p>`
    ],
    [
      "a coloured highlight inside ins",
      `++==${RED}x==++`,
      `<p><ins><mark data-highlight="red">x</mark></ins></p>`
    ],
    [
      "a marker inside del inside a highlight",
      `==--${RED}x--==`,
      `<p><mark><del>${RED}x</del></mark></p>`
    ],
    [
      "a coloured highlight inside a spoiler",
      `||==${RED}x==||`,
      `<p>${SPOILER(`<mark data-highlight="red">x</mark>`)}</p>`
    ],
    [
      "a spoiler after the marker",
      `==${RED}||x||==`,
      `<p><mark data-highlight="red">${SPOILER(`x`)}</mark></p>`
    ],
    [
      "a marker inside a spoiler inside a highlight",
      `==||${RED}x||==`,
      `<p><mark>${SPOILER(`${RED}x`)}</mark></p>`
    ]
  ];

  // In the presets' order, and reversed: the colour is read from the highlight once it is made, so it does not depend on which set runs first.
  const orders = [
    ["in the presets' order", false],
    ["in reverse order", true]
  ] as const;
  const inOrder = <T>(list: T[], reverse: boolean): T[] =>
    reverse ? list.toReversed() : list;

  describe.each(orders)("%s", (_order, reverse) => {
    const md = inOrder([kbd, del, ins, mark, spoiler], reverse).reduce(
      (it, plugin) => it.use(plugin),
      new MarkdownIt()
    );
    const remarkPlugins: PluggableList = inOrder(
      [remarkKbd, remarkDel, remarkIns, remarkMark, remarkSpoiler],
      reverse
    );
    const processor = unified()
      .use(remarkParse)
      .use(remarkPlugins)
      .use(remarkRehype, { handlers: spoilerHastHandlers })
      .use(rehypeStringify);
    const renders = [
      ["markdown-it", (input: string) => normalizeHtml(md.render(input))],
      [
        "remark",
        (input: string) => normalizeHtml(String(processor.processSync(input)))
      ],
      [
        "sätteri",
        (input: string) =>
          normalizeHtml(
            markdownToHtml(input, {
              features: satFeatures,
              mdastPlugins: inOrder(
                [
                  satteriKbd(),
                  satteriDel(),
                  satteriIns(),
                  satteriMark(),
                  satteriSpoiler()
                ],
                reverse
              )
            }).html
          )
      ]
    ] as const;

    describe.each(renders)("%s", (_engine, render) => {
      it.each(cases)("%s", (_name, input, expected) => {
        expect(render(input)).toBe(expected);
      });
    });
  });
});

describe("highlight colours and line endings: a CRLF or a lone CR document colours the same", () => {
  const cases: Case[] = [
    [
      "CRLF between blocks",
      `==${RED}a==\r\n\r\n> ==${GREEN}b==\r\n`,
      `<p><mark data-highlight="red">a</mark></p><blockquote><p><mark data-highlight="green">b</mark></p></blockquote>`
    ],
    [
      "a lone CR between blocks",
      `==${RED}a==\r\r- ==${GREEN}b==\r`,
      `<p><mark data-highlight="red">a</mark></p><ul><li><mark data-highlight="green">b</mark></li></ul>`
    ],
    [
      "a CRLF hard break straight after the marker",
      `==${RED}\\\r\ntext==`,
      `<p><mark data-highlight="red"><br>\ntext</mark></p>`
    ]
  ];

  describe.each(engines)("%s", (_engine, render) => {
    it.each(cases)("%s", (_name, input, expected) => {
      expect(render(input)).toBe(expected);
    });
  });
});

describe("highlight colours on long input: reading the colour stays linear", () => {
  // A run of markers must not be read one by one, and a line of many emptied highlights must not shift the rest of the line once for each: either is quadratic, seconds at this length. Each case is timed against the same input with a brown circle, an emoji of the same length that is not a marker, so what is measured is the colour's own cost and not the engine's.
  const BROWN = "\u{1F7E4}";
  const cases: Case[] = [
    [
      "a highlight of 20,000 markers takes the colour of the first",
      `==${RED.repeat(20_000)}==`,
      `<p><mark data-highlight="red">${RED.repeat(19_999)}</mark></p>`
    ],
    [
      "a highlight of one marker and 20,000 characters",
      `==${RED}${"a".repeat(20_000)}==`,
      `<p><mark data-highlight="red">${"a".repeat(20_000)}</mark></p>`
    ],
    [
      "a line of 20,000 highlights that are only a marker",
      `==${RED}== `.repeat(20_000),
      `<p>${`<mark data-highlight="red"></mark> `.repeat(19_999)}<mark data-highlight="red"></mark></p>`
    ]
  ];

  describe.each(engines)("%s", (_engine, render) => {
    const timed = (input: string): number => {
      const started = performance.now();
      render(input);
      return performance.now() - started;
    };

    it.each(cases)("%s", (_name, input, expected) => {
      const plain = timed(input.replaceAll(RED, BROWN));
      expect(timed(input) - plain).toBeLessThan(HOSTILE_TIME_LIMIT);
      expect(render(input)).toBe(expected);
    });
  });
});
