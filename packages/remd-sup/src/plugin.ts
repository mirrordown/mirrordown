import { visit } from "unist-util-visit";
import type { Visitor, VisitorResult } from "unist-util-visit";
import type { Plugin, Transformer } from "unified";
import type { Data, Parent, PhrasingContent, Root, Text } from "mdast";
import { findAllBetween } from "unist-util-find-between-all";
import { findAllBefore } from "unist-util-find-all-before";
import { findAllAfter } from "unist-util-find-all-after";
import { findAfter } from "unist-util-find-after";
import { u } from "unist-builder";

export interface SuperscriptData extends Data {}

export interface Superscript extends Parent {
  type: `superscript`;
  children: PhrasingContent[];
  data?: SuperscriptData | undefined;
}

export const REGEX = /\^(?!\s)([\s\S]*?)(?<!\s)\^/;
export const REGEX_GLOBAL = /\^(?!\s)([\s\S]*?)(?<!\s)\^/g;

export const REGEX_STARTING = /\^(?!\s)/;
export const REGEX_STARTING_GLOBAL = /\^(?!\s)/g;

export const REGEX_ENDING = /(?<!\s)\^/;
export const REGEX_ENDING_GLOBAL = /(?<!\s)\^/g;

export const remarkSup: Plugin<[], Root> = () => {
  const constructSuperscriptNode = (
    children: PhrasingContent[]
  ): Superscript => ({
    type: `superscript`,
    children,
    data: { hName: `sup` }
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
      const [matched, superscriptText] = match;
      const mIndex = match.index;
      const mLength = matched.length;

      const textPartIndex = prevMatchIndex + prevMatchLength;

      prevMatchIndex = mIndex;
      prevMatchLength = mLength;

      if (mIndex > textPartIndex) {
        children.push(u(`text`, value.substring(textPartIndex, mIndex)));
      }

      children.push(
        constructSuperscriptNode([
          { type: `text`, value: superscriptText.trim() }
        ])
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
      constructSuperscriptNode(mainChildren),
      ...afterChildren
    ];

    return index;
  };

  const transformer: Transformer<Root> = (tree) => {
    visit(tree, `text`, visitorFirst);
    visit(tree, `text`, visitorSecond);
  };

  return transformer;
};
