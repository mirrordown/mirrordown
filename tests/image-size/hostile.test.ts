import { describe, expect, it } from "vite-plus/test";
import { engines } from "../presets/engines.js";
import {
  HOSTILE_TIME_LIMIT,
  comparable,
  hostileCases
} from "../utils/hostile.js";
import { only } from "./presets.js";

const RUN = 20_000;

// Only image-size is on, so a failure names it; the same pipelines with it off too, to time against what the engines take by themselves.
const renderers = engines.map(([, render]) => render(only(`imageSize`)));
const bare = engines.map(([, render]) => render(only()));

const timed = (run: () => void): number => {
  const started = performance.now();
  run();
  return performance.now() - started;
};

// hast-util-to-html writes a backtick in an attribute value as `&#x60;`, and markdown-it writes it bare, with or without this plugin; `normalizeHtml` does not unify that spelling. The alt is an attribute, so the replacement patterns' `` $` `` reaches it.
const spelled = (html: string): string => html.replaceAll(`&#x60;`, "`");

/** Each engine's HTML for `input`, once the time it took with the plugin has been checked against the time without it. */
const rendered = (input: string): string[] => {
  const html: string[] = [];
  const without = timed(() => bare.forEach((render) => render(input)));
  const withSet = timed(() =>
    renderers.forEach((render) => html.push(spelled(comparable(render(input)))))
  );
  expect(withSet - without).toBeLessThan(HOSTILE_TIME_LIMIT);
  return html;
};

// The description is the sized content and the bar the character the scan looks for: every case of the shared table renders without throwing, in time, and the same in every engine.
describe("hostile input through image-size", () => {
  it.each(hostileCases((text) => `![${text}|100](u.jpg)`, `|`))(
    "$name",
    ({ input }) => {
      const html = rendered(input);
      expect(html).toStrictEqual(html.map(() => html[0]));
    }
  );
});

// The scan reads the text after the last bar, and the whitespace before it from the end: neither restarts on a long run.
describe("long descriptions through image-size", () => {
  it.each([
    [`a description of ${RUN} bars`, `|`.repeat(RUN), `|`.repeat(RUN)],
    [`a description of ${RUN} digits`, `1`.repeat(RUN), `1`.repeat(RUN)],
    [
      `${RUN} bars before a size`,
      `${`|`.repeat(RUN)}100`,
      `${`|`.repeat(RUN - 1)}" width="100`
    ],
    [`${RUN} spaces before a size`, `a${` `.repeat(RUN)}|100`, `a" width="100`],
    [
      `${RUN} spaces inside the alt text`,
      `a${` `.repeat(RUN)}b|100`,
      `a${` `.repeat(RUN)}b" width="100`
    ]
  ])("%s", (_name, description, alt) => {
    expect(rendered(`![${description}](u.jpg)`)).toStrictEqual(
      engines.map(() => `<p><img src="u.jpg" alt="${alt}"></p>`)
    );
  });
});

// markdown-it turns every line ending into `\n`, and remark and Sätteri keep a `\r` as written in the alt, which no plugin decides; `comparable` reads them alike.
describe("line endings through image-size", () => {
  it.each([
    [
      "CRLF between paragraphs",
      "Before\r\n\r\n![a|100](u.jpg)\r\n\r\nAfter",
      '<p>Before</p><p><img src="u.jpg" alt="a" width="100"></p><p>After</p>'
    ],
    [
      "CRLF inside the description",
      "![one\r\ntwo|100](u.jpg)",
      '<p><img src="u.jpg" alt="one\ntwo" width="100"></p>'
    ],
    [
      "CRLF right before the bar",
      "![one\r\n|100](u.jpg)",
      '<p><img src="u.jpg" alt="one" width="100"></p>'
    ],
    [
      "a lone CR inside the description",
      "![one\rtwo|100](u.jpg)",
      '<p><img src="u.jpg" alt="one\ntwo" width="100"></p>'
    ]
  ])("%s", (_name, input, expected) => {
    expect(rendered(input)).toStrictEqual(engines.map(() => expected));
  });
});
