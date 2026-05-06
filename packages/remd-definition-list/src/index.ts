import { u } from "unist-builder";
import type { Plugin } from "unified";
import type { Root } from "mdast";
import type { ElementContent } from "hast";
import type { State } from "mdast-util-to-hast";
import { defList } from "./syntax.js";
import { defListFromMarkdown } from "./from-markdown.js";
import type { DefinitionDescription, DefinitionList, DefinitionTerm } from "./types.js";

export type { DefinitionList, DefinitionTerm, DefinitionDescription };

export const remarkDefinitionList: Plugin<[], Root> = function () {
  const data = this.data() as {
    micromarkExtensions?: unknown[];
    fromMarkdownExtensions?: unknown[];
  };

  (data.micromarkExtensions ??= []).push(defList);
  (data.fromMarkdownExtensions ??= []).push(defListFromMarkdown);
};

const defList2hast = (state: State, node: DefinitionList): ElementContent => {
  const items = state.all(node);
  const children: ElementContent[] = [];
  for (const item of items) {
    children.push(u("text", "\n") as ElementContent);
    children.push(item);
  }
  if (items.length > 0) children.push(u("text", "\n") as ElementContent);
  const result: ElementContent = { type: "element", tagName: "dl", properties: {}, children };
  state.patch(node, result);
  return result;
};

const defListTerm2hast = (state: State, node: DefinitionTerm): ElementContent => {
  const result: ElementContent = {
    type: "element",
    tagName: "dt",
    properties: {},
    children: state.all(node),
  };
  state.patch(node, result);
  return result;
};

const defListDescription2hast = (state: State, node: DefinitionDescription): ElementContent => {
  const children: ElementContent[] = [];
  const tmpChildren = state.all(node);
  let lastChildUnwrapped = false;

  for (let i = 0; i < tmpChildren.length; i++) {
    const child = tmpChildren[i];
    const isP = child.type === "element" && child.tagName === "p";
    if (node.spread || i !== 0 || !isP) {
      children.push(u("text", "\n") as ElementContent);
    }
    if (!node.spread && isP) {
      children.push(...child.children);
      lastChildUnwrapped = true;
    } else {
      children.push(child);
      lastChildUnwrapped = false;
    }
  }

  if (!lastChildUnwrapped && children.length > 0) {
    children.push(u("text", "\n") as ElementContent);
  }

  const result: ElementContent = { type: "element", tagName: "dd", properties: {}, children };
  state.patch(node, result);
  return result;
};

export const defListHastHandlers = {
  defList: defList2hast,
  defListTerm: defListTerm2hast,
  defListDescription: defListDescription2hast,
} as const;
