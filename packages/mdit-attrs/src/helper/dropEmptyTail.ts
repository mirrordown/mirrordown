import type Token from "markdown-it/lib/token.mjs";

/**
 * Drops the last child when stripping its attribute block left it empty, and a soft break before it. A block on a line of its own leaves only that line ending behind, and it is not part of the element's text: remark trims it, and the softbreak rule removes it when that rule is on.
 */
export const dropEmptyTail = (children: Token[]): void => {
  if (children.length < 2 || children[children.length - 1].content !== "")
    return;
  children.pop();
  if (children.length > 1 && children[children.length - 1].type === "softbreak")
    children.pop();
};
