import { visit } from "unist-util-visit";
import type { Visitor, VisitorResult } from "unist-util-visit";
import type { Plugin, Transformer } from "unified";
import type { Data, Parent, PhrasingContent, Root, Text } from "mdast";
import { findAllBetween } from "unist-util-find-between-all";
import { findAllBefore } from "unist-util-find-all-before";
import { findAllAfter } from "unist-util-find-all-after";
import { findAfter } from "unist-util-find-after";
import { u } from "unist-builder";

interface DeleteData extends Data {}

interface Delete extends Parent {
  type: `delete`;
  children: PhrasingContent[];
  data?: DeleteData | undefined;
}

// Note: `delete` is a built-in mdast node type (@types/mdast already registers
// `delete: Delete` in its content maps), so no module augmentation is needed —
// the local Delete is structurally identical and used internally.

const REGEX = /--(?![\s+])([\s\S]*?)(?<![\s+])--/;
const REGEX_GLOBAL = /--(?![\s+])([\s\S]*?)(?<![\s+])--/g;

const REGEX_STARTING = /--(?![\s]|\++\s)/;
const REGEX_STARTING_GLOBAL = /--(?![\s]|-+\s)/g;

const REGEX_ENDING = /(?<!\s|\s-|\s-|\s-|\s-)--/;
const REGEX_ENDING_GLOBAL = /(?<!\s|\s-|\s-|\s-|\s-)--/g;

/**
 * remark plugin for deletion syntax (`--text--`), wrapping each match in a
 * `delete` mdast node that renders as a `<del>` element.
 */
export const remarkDel: Plugin<[], Root> = () => {
  const constructDeleteNode = (children: PhrasingContent[]): Delete => {
    return {
      type: `delete`,
      children,
      data: { hName: `del` }
    };
  };

  const visitorFirst: Visitor<Text, Parent> = (
    node,
    index,
    parent
  ): VisitorResult => {
    /* v8 ignore next */
    if (!parent || typeof index === `undefined`) return;

    if (!REGEX.test(node.value)) return;

    const children: PhrasingContent[] = [];
    const value = node.value;
    let tempValue = ``;
    let prevMatchIndex = 0;
    let prevMatchLength = 0;

    const matches = Array.from(value.matchAll(REGEX_GLOBAL));

    for (const match of matches) {
      const [matched, insertedText] = match;
      const mIndex = match.index;
      const mLength = matched.length;

      const textPartIndex = prevMatchIndex + prevMatchLength;

      prevMatchIndex = mIndex;
      prevMatchLength = mLength;

      if (mIndex > textPartIndex) {
        children.push(u(`text`, value.substring(textPartIndex, mIndex)));
      }

      children.push(
        constructDeleteNode([{ type: `text`, value: insertedText.trim() }])
      );

      tempValue = value.slice(mIndex + mLength);
    }

    if (tempValue) {
      children.push(u(`text`, tempValue));
    }

    if (children.length) parent.children.splice(index, 1, ...children);
  };

  const visitorSecond: Visitor<Text, Parent> = (
    node,
    index,
    parent
  ): VisitorResult => {
    /* v8 ignore next */
    if (!parent || typeof index === `undefined`) return;

    if (!REGEX_STARTING.test(node.value)) return;

    const openingNode = node;

    const closingNode = findAfter(parent, openingNode, (n): n is Text => {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      return n.type === `text` && REGEX_ENDING.test((n as Text).value);
    });

    if (!closingNode) return;

    // unist-util-find-all-* are generic over Parent; we know paragraph
    // siblings are PhrasingContent. The cast narrows the lib's `Node[]`
    // return to the concrete child type we know we're working with.
    /* oxlint-disable typescript/no-unsafe-type-assertion */
    const beforeChildren = findAllBefore(
      parent,
      openingNode
    ) as PhrasingContent[];
    const mainChildren = findAllBetween(
      parent,
      openingNode,
      closingNode
    ) as PhrasingContent[];
    const afterChildren = findAllAfter(
      parent,
      closingNode
    ) as PhrasingContent[];
    /* oxlint-enable typescript/no-unsafe-type-assertion */

    const value = openingNode.value;
    const match = Array.from(value.matchAll(REGEX_STARTING_GLOBAL))[0];
    const [matched] = match;
    const mIndex = match.index;
    const mLength = matched.length;

    if (mIndex > 0) {
      beforeChildren.push(u(`text`, value.substring(0, mIndex)));
    }

    if (value.length > mIndex + mLength) {
      mainChildren.unshift(u(`text`, value.slice(mIndex + mLength)));
    }

    const value_ = closingNode.value;
    const match_ = Array.from(value_.matchAll(REGEX_ENDING_GLOBAL))[0];
    const [matched_] = match_;
    const mIndex_ = match_.index;
    const mLength_ = matched_.length;

    if (mIndex_ > 0) {
      mainChildren.push(u(`text`, value_.substring(0, mIndex_)));
    }

    if (value_.length > mIndex_ + mLength_) {
      afterChildren.unshift(u(`text`, value_.slice(mIndex_ + mLength_)));
    }

    parent.children = [
      ...beforeChildren,
      constructDeleteNode(mainChildren),
      ...afterChildren
    ];

    return index; // re-visit after restructuring children
  };

  const transformer: Transformer<Root> = (tree) => {
    visit(tree, `text`, visitorFirst);
    visit(tree, `text`, visitorSecond);
  };

  return transformer;
};
