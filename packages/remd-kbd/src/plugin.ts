import { visit } from "unist-util-visit";
import type { Visitor, VisitorResult } from "unist-util-visit";
import type { Plugin, Transformer } from "unified";
import type { Data, Parent, PhrasingContent, Root, Text } from "mdast";
import { findAllBetween } from "unist-util-find-between-all";
import { findAllBefore } from "unist-util-find-all-before";
import { findAllAfter } from "unist-util-find-all-after";
import { findAfter } from "unist-util-find-after";
import { u } from "unist-builder";

/** Optional data carried by a {@link Kbd} node. */
export interface KbdData extends Data {}

/** An mdast node for `[[key]]` syntax, rendered as a `<kbd>` element. */
export interface Kbd extends Parent {
  type: `kbd`;
  children: PhrasingContent[];
  data?: KbdData | undefined;
}

// [[ and ]] delimiters; no ] or newline allowed in content (single-node case)
const REGEX = /\[\[([^\]\n]*?)\]\]/;
const REGEX_GLOBAL = /\[\[([^\]\n]*?)\]\]/g;

const REGEX_STARTING_GLOBAL = /\[\[/g;

const REGEX_ENDING_GLOBAL = /\]\]/g;

/**
 * remark plugin for keyboard-key syntax (`[[Ctrl]]`), wrapping each match in a
 * {@link Kbd} node that renders as a `<kbd>` element.
 */
export const remarkKbd: Plugin<[], Root> = () => {
  const constructKbdNode = (children: PhrasingContent[]): Kbd => ({
    type: `kbd`,
    children,
    data: { hName: `kbd` }
  });

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
      const [matched, kbdText] = match;
      const mIndex = match.index;
      const mLength = matched.length;

      const textPartIndex = prevMatchIndex + prevMatchLength;

      prevMatchIndex = mIndex;
      prevMatchLength = mLength;

      if (mIndex > textPartIndex) {
        children.push(u(`text`, value.substring(textPartIndex, mIndex)));
      }

      children.push(constructKbdNode([{ type: `text`, value: kbdText }]));

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

    if (!node.value.includes("[[")) return;

    const openingNode = node;

    const closingNode = findAfter(parent, openingNode, (n): n is Text => {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      return n.type === `text` && (n as Text).value.includes("]]");
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
      constructKbdNode(mainChildren),
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
