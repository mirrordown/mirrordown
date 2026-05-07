import { SKIP, visit } from "unist-util-visit";
import { whitespace } from "hast-util-whitespace";
import type { Element, Root } from "hast";
import type { Plugin } from "unified";

const UNKNOWN = 1 as const;
const HAS_IMAGE = 2 as const;
const HAS_OTHER = 3 as const;
type ApplicableResult = typeof UNKNOWN | typeof HAS_IMAGE | typeof HAS_OTHER;

// Returns HAS_IMAGE if node's children are only images/whitespace (possibly
// wrapped in a link), UNKNOWN if empty/whitespace-only, HAS_OTHER otherwise.
const applicable = (node: Element, inLink: boolean): ApplicableResult => {
  let result: ApplicableResult = UNKNOWN;

  for (const child of node.children) {
    if (child.type === "text" && whitespace(child.value)) continue;

    if (child.type !== "element") return HAS_OTHER;

    if (child.tagName === "img") {
      result = HAS_IMAGE;
      continue;
    }

    if (!inLink && (child.tagName === "a" || child.tagName === "button")) {
      const inner = applicable(child, true);
      if (inner === HAS_OTHER) return HAS_OTHER;
      if (inner === HAS_IMAGE) result = HAS_IMAGE;
      continue;
    }

    return HAS_OTHER;
  }

  return result;
};

export const rehypeUnwrapImages: Plugin<[], Root> = () => (tree) => {
  visit(tree, "element", (node, index, parent) => {
    if (
      node.tagName === "p" &&
      parent &&
      typeof index === "number" &&
      applicable(node, false) === HAS_IMAGE
    ) {
      parent.children.splice(index, 1, ...node.children);
      return [SKIP, index];
    }
  });
};
