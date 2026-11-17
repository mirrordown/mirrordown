import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { unwrapImages } from "../../packages/mdit-unwrap-images/src";
import { rehypeUnwrapImages } from "../../packages/remd-unwrap-images/src";
import { satteriUnwrapImages } from "../../packages/sat-unwrap-images/src";

// The rehype and Sätteri plugins share one rule for "a paragraph of only images" (`isImageParagraph` in core); markdown-it works on tokens and has its own. These cases hold the three to the same answer for every shape the rule names: an image in a link, and whitespace between images. Output is compared untouched apart from the ends, because the whitespace between two inline images is the thing under test and `normalizeHtml` would drop a line break there.

const md = new MarkdownIt().use(unwrapImages);
const mdit = (input: string): string => md.render(input).trim();

const remd = (input: string): string =>
  String(
    unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeUnwrapImages)
      .use(rehypeStringify)
      .processSync(input)
  ).trim();

const sat = (input: string): string =>
  markdownToHtml(input, {
    features: { gfm: false, frontmatter: false, smartPunctuation: false },
    hastPlugins: [satteriUnwrapImages()]
  }).html.trim();

const engines = [
  ["markdown-it", mdit],
  ["remark", remd],
  ["sätteri", sat]
] as const;

const A = '<img src="a.png" alt="a">';
const B = '<img src="b.png" alt="b">';

const cases: [name: string, input: string, expected: string][] = [
  [
    "an image inside a link is unwrapped with its link",
    "[![a](a.png)](https://example.com)",
    `<a href="https://example.com">${A}</a>`
  ],
  [
    "a linked image beside a plain one is unwrapped",
    "[![a](a.png)](https://example.com) ![b](b.png)",
    `<a href="https://example.com">${A}</a> ${B}`
  ],
  [
    "two images on one line keep the space between them",
    "![a](a.png) ![b](b.png)",
    `${A} ${B}`
  ],
  [
    "two images on two lines keep the line break between them",
    "![a](a.png)\n![b](b.png)",
    `${A}\n${B}`
  ],
  [
    "a link holding text as well as an image keeps its paragraph",
    "[![a](a.png) text](https://example.com)",
    `<p><a href="https://example.com">${A} text</a></p>`
  ],
  [
    "a link with no image keeps its paragraph",
    "[text](https://example.com)",
    `<p><a href="https://example.com">text</a></p>`
  ]
];

describe.each(engines)("unwrap-images parity (%s)", (_engine, render) => {
  it.each(cases)("%s", (_name, input, expected) => {
    expect(render(input)).toBe(expected);
  });
});
