import type { PluginSimple } from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import { codePointBefore, cjkBreakRemoved } from "@mirrordown/core";

// Inline markup that wraps content the reader sees in place, so the character next to a break can be inside it: emphasis, strong, strikethrough and links, and the spans of the Mirrordown sets (mark, ins, del, spoiler, sub, sup, kbd, ruby, abbr; a tag is a link). The same set as the mdast types `removeCjkBreaks` in `@mirrordown/core` reads through.
const WRAPPERS = new Set(
  [
    `em`,
    `strong`,
    `s`,
    `link`,
    `mark`,
    `ins`,
    `del`,
    `spoiler`,
    `sub`,
    `sup`,
    `kbd`,
    `ruby`,
    `abbr`
  ].flatMap((name) => [`${name}_open`, `${name}_close`])
);

// A ruby's fallback parentheses show no character in the line. Its reading (`rt_open` to `rt_close`) is stepped over whole: it sits over the base text, not beside it.
const SKIPPED = new Set([`rp_open`, `rp_close`]);

// The character the reader sees next to the soft break at `index` of `children`, looking back (`step` -1) or ahead (1) through inline markup: `undefined` at the start or end of the block, or at a token that is not text (an image, raw HTML, a hard break, another soft break, a token of a plugin not listed above). A code span counts by its own content.
const beside = (
  children: readonly Token[],
  index: number,
  step: -1 | 1
): string | undefined => {
  for (let i = index + step; i >= 0 && i < children.length; i += step) {
    const token = children[i]!;
    const { type, content } = token;
    if (WRAPPERS.has(type) || SKIPPED.has(type)) continue;
    if (type === (step < 0 ? `rt_close` : `rt_open`)) {
      let depth = 0;
      for (; i >= 0 && i < children.length; i += step) {
        const inner = children[i]!.type;
        if (inner === `rt_open`) depth += step;
        if (inner === `rt_close`) depth -= step;
        if (depth === 0) break;
      }
      continue;
    }
    if (type === `text` && content === ``) continue;
    if (type !== `text` && type !== `code_inline`) return undefined;
    if (content === ``) return undefined;
    return step < 0
      ? String.fromCodePoint(codePointBefore(content, content.length)!)
      : String.fromCodePoint(content.codePointAt(0)!);
  }
  return undefined;
};

/**
 * markdown-it plugin that removes a soft line break between two Chinese or Japanese characters, where the browser would show it as a space: both characters East Asian Width W, F or H and neither Hangul, or either one the zero-width space U+200B. The character on each side is the one the reader sees next to the break, read through emphasis, links and the Mirrordown spans; a code span counts by its own content. Hard breaks are never touched, nor is a document rendered with `breaks: true`, whose every line break is one. The rule is shared with the remark and Sätteri plugins through `@mirrordown/core`. Use it after every plugin that reads lines: its rule goes at the end of the core chain, and of the plugins that put theirs there too, it has to come after mdit-caption.
 */
export const cjkBreaks: PluginSimple = (md) => {
  md.core.ruler.push(`cjk_breaks`, (state) => {
    if (state.md.options.breaks) return;
    for (const block of state.tokens) {
      const children = block.children;
      if (block.type !== `inline` || !children) continue;
      // Every break is decided on the tokens as they came: the kept ones go to a list of their own, and `children` is read, never changed.
      const kept: Token[] = [];
      for (let index = 0; index < children.length; index++) {
        const token = children[index]!;
        if (
          token.type !== `softbreak` ||
          !cjkBreakRemoved(
            beside(children, index, -1),
            beside(children, index, 1)
          )
        )
          kept.push(token);
      }
      if (kept.length < children.length) block.children = kept;
    }
  });
};
