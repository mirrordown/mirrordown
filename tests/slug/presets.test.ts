import { describe, expect, it } from "vite-plus/test";
import { engines } from "../presets/engines.js";

// A heading's id is made from the text a reader sees. remark and Sätteri read that off the rendered tree; markdown-it reads it off its tokens, where each inline plugin decides what its tokens hold. A link to `#press-ctrl-now` has to land in every engine, so each inline set's syntax goes through the three presets here: a new set whose markdown-it tokens keep text somewhere the slug does not look, or that renders text the tree does not have, fails this.
const ids = (html: string): string[] =>
  [...html.matchAll(/<h\d[^>]*\sid="([^"]*)"/g)].map(([, id = ``]) => id);

const cases: [set: string, input: string, id: string][] = [
  [`kbd`, `## Press [[Ctrl]] now`, `press-ctrl-now`],
  [`ruby`, `## {漢字|kanji} ruby`, `漢字kanji-ruby`],
  [`spoiler`, `## ||secret|| spoiler`, `secret-spoiler`],
  [`sub and sup`, `## H~2~O and x^2^`, `h2o-and-x2`],
  [`ins, del and mark`, `## ++ins++ --del-- ==mark==`, `ins-del-mark`],
  [`strikethrough`, `## ~~gone~~ now`, `gone-now`],
  [`abbr`, `*[HTML]: Hyper Text\n\n## The HTML spec`, `the-html-spec`],
  [`attrs`, `## Styled heading {.x}`, `styled-heading`],
  [`several keys and rubies`, `## [[Ctrl]]+[[C]] {a|b}{c|d}`, `ctrlc-abcd`],
  // An image's alt is an attribute, not text: the same in a lightbox trigger.
  [`an image`, `## Logo ![alt text](logo.png) here`, `logo--here`],
  [`a lightbox image`, `## Logo !![alt text](logo.png) here`, `logo--here`],
  [
    `code, emphasis, a link and an autolink`,
    "## `code` and *em* **strong** [link](/x) <https://a.b>",
    `code-and-em-strong-link-httpsab`
  ],
  // A line ending inside a heading is no text in markdown-it's tokens and is dropped by the slugger from the tree's.
  [`a heading of two lines`, `line one\nline two\n===`, `line-oneline-two`]
];

describe.each(cases)(
  `slug: a heading with %s gets the same id in every engine`,
  (_set, input, id) => {
    it.each(engines)(`%s`, (_engine, make) => {
      expect(ids(make()(input))).toEqual([id]);
    });
  }
);

// The fallback parentheses of a ruby are text in the tree (inside `<rp>`). In markdown-it they are the content of the ruby plugin's own tokens, which a slug made from `text` and `code_inline` tokens alone left out.
describe(`slug: a ruby's fallback parentheses are part of the heading's text`, () => {
  it.each(engines)(`%s`, (_engine, make) => {
    const render = make({ ruby: { rp: [`open`, `close`] } });
    expect(ids(render(`## {漢字|kanji} ruby`))).toEqual([
      `漢字openkanjiclose-ruby`
    ]);
  });
});
