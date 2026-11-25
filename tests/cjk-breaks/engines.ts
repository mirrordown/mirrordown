import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { cjkBreaks } from "../../packages/mdit-cjk-breaks/src";
import { remarkCjkBreaks } from "../../packages/remd-cjk-breaks/src";
import { satteriCjkBreaks } from "../../packages/sat-cjk-breaks/src";
import { comparable } from "../utils/hostile.js";

// Each engine with the plugin alone (and GFM where asked), returning its HTML as it wrote it, with only the line endings unified: `normalizeHtml` drops a line break between two tags, which is exactly what `**日本**⏎**語**` turns on.
export const markdownIt = (): ((input: string) => string) => {
  const md = new MarkdownIt().use(cjkBreaks);
  return (input) => comparable(md.render(input));
};

export const remark = (gfm = false): ((input: string) => string) => {
  const processor = unified()
    .use(remarkParse)
    .use(gfm ? [remarkGfm] : [])
    .use(remarkCjkBreaks)
    .use(remarkRehype)
    .use(rehypeStringify);
  return (input) => comparable(String(processor.processSync(input)));
};

export const satteri = (gfm = false): ((input: string) => string) => {
  return (input) =>
    comparable(
      markdownToHtml(input, {
        features: { gfm, frontmatter: false, smartPunctuation: false },
        mdastPlugins: [satteriCjkBreaks()]
      }).html
    );
};

export const engines = [
  [`markdown-it`, markdownIt()],
  [`remark`, remark()],
  [`sätteri`, satteri()]
] as const;
