import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { comparable } from "../utils/hostile.js";
import { parseCases } from "../utils/index.js";
import { markdownIt, remark, satteri } from "./engines.js";
import { paragraphs } from "./generate.js";
import { withLineEndings } from "./line-endings.js";

// The three engines without the plugin, to tell a disagreement the plugin made from one the parsers already had.
const md = new MarkdownIt();
const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeStringify);
const bare = [
  (input: string) => comparable(md.render(input)),
  (input: string) => comparable(String(processor.processSync(input))),
  (input: string) =>
    comparable(
      markdownToHtml(input, {
        features: { gfm: false, frontmatter: false, smartPunctuation: false }
      }).html
    )
];
const withPlugin = [markdownIt(), remark(), satteri()];

const dir = import.meta.dirname;
const fixtures = withLineEndings(
  readdirSync(join(dir, `fixtures`)).flatMap((file) =>
    parseCases(readFileSync(join(dir, `fixtures`, file), `utf8`))
  )
).map(({ input }) => input);
const generated = paragraphs(4000, 20261125);

const agree = (html: readonly string[]): boolean =>
  html.every((one) => one.trimEnd() === html[0].trimEnd());

// The HTML is compared as each engine writes it (line endings unified), not through `normalizeHtml`, which would hide a break left between two tags.
describe(`cjk-breaks renders the same in all three engines`, () => {
  it.each([
    [`the fixtures, with each line ending`, fixtures],
    [`4,000 generated paragraphs`, generated]
  ])(`on %s`, { timeout: 120_000 }, (_, inputs) => {
    // Inputs the parsers already render differently (emphasis next to an emoji, which they classify by different Unicode versions) are left out: the plugin cannot make them agree. Every other input must still agree with the plugin on.
    const disagreed = inputs.filter(
      (input) =>
        agree(bare.map((render) => render(input))) &&
        !agree(withPlugin.map((render) => render(input)))
    );
    expect(disagreed).toStrictEqual([]);
  });
});
