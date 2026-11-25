import MarkdownIt from "markdown-it";
import { unified, type PluggableList } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { cjkFriendly } from "../../packages/mdit-cjk-friendly/src";
import { remarkCjkFriendly } from "../../packages/remd-cjk-friendly/src";
import { del } from "../../packages/mdit-del/src";
import { ins } from "../../packages/mdit-ins/src";
import { mark } from "../../packages/mdit-mark/src";
import { spoiler } from "../../packages/mdit-spoiler/src";
import { sub } from "../../packages/mdit-sub/src";
import { sup } from "../../packages/mdit-sup/src";
import { remarkDel } from "../../packages/remd-del/src";
import { remarkIns } from "../../packages/remd-ins/src";
import { remarkMark } from "../../packages/remd-mark/src";
import {
  remarkSpoiler,
  spoilerHastHandlers
} from "../../packages/remd-spoiler/src";
import { remarkSub } from "../../packages/remd-sub/src";
import { remarkSup } from "../../packages/remd-sup/src";
import { normalizeHtml } from "../utils/index.js";

/** What a pipeline holds: the plugin under test, GFM, and Mirrordown's delimiter sets, whose runs take its rule. */
export interface Pipeline {
  cjk?: boolean;
  gfm?: boolean;
  spans?: boolean;
}

/** markdown-it, which has GFM strikethrough built in: off is its CommonMark counterpart. */
export const markdownIt = ({
  cjk = true,
  gfm = true,
  spans = true
}: Pipeline = {}): ((input: string) => string) => {
  const md = new MarkdownIt();
  if (!gfm) md.disable(`strikethrough`);
  if (cjk) md.use(cjkFriendly);
  if (spans) md.use(del).use(ins).use(mark).use(spoiler).use(sub).use(sup);
  return (input) => normalizeHtml(md.render(input));
};

/** remark, with GFM's single-tilde strikethrough off as in the preset, so `~x~` is subscript in both engines. */
export const remark = ({
  cjk = true,
  gfm = true,
  spans = true
}: Pipeline = {}): ((input: string) => string) => {
  const plugins: PluggableList = [];
  if (gfm) plugins.push([remarkGfm, { singleTilde: false }]);
  if (cjk) plugins.push(remarkCjkFriendly);
  if (spans) {
    plugins.push(
      remarkDel,
      remarkIns,
      remarkMark,
      remarkSpoiler,
      remarkSub,
      remarkSup
    );
  }
  const processor = unified()
    .use(remarkParse)
    .use(plugins)
    .use(remarkRehype, { handlers: spoilerHastHandlers })
    .use(rehypeStringify);
  return (input) => normalizeHtml(String(processor.processSync(input)));
};

/** markdown-it writes GFM strikethrough as `<s>`, remark as `<del>`: each engine's own choice, which no plugin makes. Comparisons of strikethrough read markdown-it's as remark's. */
export const asDel = (html: string): string =>
  html.replaceAll(`<s>`, `<del>`).replaceAll(`</s>`, `</del>`);
