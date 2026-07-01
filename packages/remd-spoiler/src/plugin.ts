import { visit } from "unist-util-visit";
import type { Visitor, VisitorResult } from "unist-util-visit";
import type { Plugin, Transformer } from "unified";
import type { Data, Parent, PhrasingContent, Root, Text } from "mdast";
import type { Element, ElementContent, Properties } from "hast";
import { findAllBetween } from "unist-util-find-between-all";
import { findAllBefore } from "unist-util-find-all-before";
import { findAllAfter } from "unist-util-find-all-after";
import { findAfter } from "unist-util-find-after";
import { u } from "unist-builder";

/** Optional data carried by a {@link Spoiler} node. */
export interface SpoilerData extends Data {}

/**
 * An mdast node for `||spoiler||` text, rendered as a click-to-reveal spoiler
 * (a `<label>` wrapping a checkbox and a content `<span>`).
 */
export interface Spoiler extends Parent {
  type: `spoiler`;
  children: PhrasingContent[];
  data?: SpoilerData | undefined;
}

// Minimal hast-handler surface. remark-rehype's real `State`/`Handler` types
// carry the whole conversion API; we only need `all()` to convert this node's
// mdast children into hast. Typed locally to avoid a dependency on
// mdast-util-to-hast just for two type names.
interface HastState {
  all: (node: Spoiler) => ElementContent[];
  patch: (from: Spoiler, to: Element) => void;
}
type SpoilerHandler = (state: HastState, node: Spoiler) => Element;

// Twin of the marker matching in mark: doubled sigil, no leading/trailing
// whitespace or extra sigil chars (so `a || b` and `|||` runs don't misfire).
const REGEX = /\|\|(?![\s|])([\s\S]*?)(?<![\s|])\|\|/;
const REGEX_GLOBAL = /\|\|(?![\s|])([\s\S]*?)(?<![\s|])\|\|/g;

const REGEX_STARTING = /\|\|(?![\s]|\|+\s)/;
const REGEX_STARTING_GLOBAL = /\|\|(?![\s]|\|+\s)/g;

const REGEX_ENDING = /(?<!\s|\s\||\s\|\||\s\|\|\||\s\|\|\|\|)\|\|/;
const REGEX_ENDING_GLOBAL = /(?<!\s|\s\||\s\|\||\s\|\|\||\s\|\|\|\|)\|\|/g;

/**
 * Build the `<label><input><span>...</span></label>` hast subtree. The checkbox
 * precedes the content span so CSS's `:checked ~ .content` combinator can reach
 * it; the content is a following sibling, not a child, of the checkbox.
 */
const buildSpoilerHast = (state: HastState, node: Spoiler): Element => {
  const inputProps: Properties = {
    type: `checkbox`,
    class: `markdown-spoiler-toggle`,
    "aria-label": `spoiler`
  };
  const input: Element = {
    type: `element`,
    tagName: `input`,
    properties: inputProps,
    children: []
  };
  const content: Element = {
    type: `element`,
    tagName: `span`,
    properties: { class: `markdown-spoiler-content` },
    children: state.all(node)
  };
  const result: Element = {
    type: `element`,
    tagName: `label`,
    properties: { class: `markdown-spoiler` },
    children: [input, content]
  };
  state.patch(node, result);
  return result;
};

/** mdast-to-hast handler for spoiler nodes, for use with `remark-rehype`. */
export const spoilerHastHandlers: Record<string, SpoilerHandler> = {
  spoiler: buildSpoilerHast
};

/**
 * remark plugin for Discord-style spoiler syntax (`||text||`), wrapping each
 * match in a {@link Spoiler} node. Pair with {@link spoilerHastHandlers} via
 * `remarkRehype({ handlers: spoilerHastHandlers })` so the node renders as a
 * click-to-reveal spoiler. Emits byte-identical HTML to
 * `@mirrordown/mdit-spoiler`.
 */
export const remarkSpoiler: Plugin<[], Root> = () => {
  const constructSpoilerNode = (children: PhrasingContent[]): Spoiler => ({
    type: `spoiler`,
    children
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
      const [matched, spoilerText] = match;
      const mIndex = match.index;
      const mLength = matched.length;

      const textPartIndex = prevMatchIndex + prevMatchLength;

      prevMatchIndex = mIndex;
      prevMatchLength = mLength;

      if (mIndex > textPartIndex) {
        children.push(u(`text`, value.substring(textPartIndex, mIndex)));
      }

      children.push(
        constructSpoilerNode([
          { type: `text`, value: (spoilerText ?? ``).trim() }
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
    /* v8 ignore next */
    if (!match) return;
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
    /* v8 ignore next */
    if (!match_) return;
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
      constructSpoilerNode(mainChildren),
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
