import type { Plugin } from "unified";
import type { Root } from "mdast";
import { enableCjkFriendly } from "@mirrordown/core";
import { cjkFriendlySyntax } from "./syntax.js";

/**
 * remark plugin that lets delimiter runs open and close beside CJK punctuation, by the CommonMark CJK-friendly Amendments: `**テスト。**テスト` is strong emphasis, where CommonMark leaves the asterisks as text. It replaces micromark's emphasis and, with `remark-gfm`, GFM's strikethrough, in either order, and turns the same rule on for Mirrordown's `==`, `++`, `--`, `||`, `~` and `^` in this processor, wherever they are listed. A run with no CJK character beside it is read as before.
 */
export const remarkCjkFriendly: Plugin<[], Root> = function () {
  // this.data() in remark plugin context returns a generic shape; the cast narrows the known extension array.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const data = this.data() as { micromarkExtensions?: unknown[] };
  enableCjkFriendly(data);
  (data.micromarkExtensions ??= []).push(cjkFriendlySyntax);
};
