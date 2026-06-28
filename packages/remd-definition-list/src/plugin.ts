// this.data() in remark plugin context returns generic shape; cast narrows the known extension arrays.
/* oxlint-disable typescript/no-unsafe-type-assertion */
import { u } from "unist-builder";
import type { Plugin } from "unified";
import type { Root } from "mdast";
import type { ElementContent, Properties } from "hast";
import type { State } from "mdast-util-to-hast";
import { defList } from "./syntax.js";
import { defListFromMarkdown } from "./from-markdown.js";
import type {
  DefinitionDescription,
  DefinitionList,
  DefinitionTerm
} from "./types.js";

export type { DefinitionList, DefinitionTerm, DefinitionDescription };

export const remarkDefinitionList: Plugin<[], Root> = function () {
  const data = this.data() as {
    micromarkExtensions?: unknown[];
    fromMarkdownExtensions?: unknown[];
  };

  (data.micromarkExtensions ??= []).push(defList);
  (data.fromMarkdownExtensions ??= []).push(defListFromMarkdown);
};

const newline = (): ElementContent => u("text", "\n") as ElementContent;

const mergeHProperties = (base: Properties, extra?: Properties): Properties => {
  if (!extra) return base;
  const { class: extraClass, ...rest } = extra;
  const result: Properties = { ...base, ...rest };
  if (extraClass) {
    const ec = Array.isArray(extraClass)
      ? extraClass.join(" ")
      : typeof extraClass === "string"
        ? extraClass
        : "";
    const bc = Array.isArray(base.class)
      ? base.class.join(" ")
      : typeof base.class === "string"
        ? base.class
        : "";
    result.class = bc ? `${bc} ${ec}` : ec;
  }
  return result;
};

const defList2hast = (state: State, node: DefinitionList): ElementContent => {
  const items = state.all(node);
  const children: ElementContent[] =
    items.length > 0
      ? [...items.flatMap((item) => [newline(), item]), newline()]
      : [];
  const properties = mergeHProperties({}, node.data?.hProperties);
  const result: ElementContent = {
    type: "element",
    tagName: "dl",
    properties,
    children
  };
  state.patch(node, result);
  return result;
};

const defListTerm2hast = (
  state: State,
  node: DefinitionTerm
): ElementContent => {
  const properties = mergeHProperties({}, node.data?.hProperties);
  const result: ElementContent = {
    type: "element",
    tagName: "dt",
    properties,
    children: state.all(node)
  };
  state.patch(node, result);
  return result;
};

const defListDescription2hast = (
  state: State,
  node: DefinitionDescription
): ElementContent => {
  const rawChildren = state.all(node);
  const children: ElementContent[] = [];
  let lastChildUnwrapped = false;

  for (let i = 0; i < rawChildren.length; i++) {
    const child = rawChildren[i];
    const isP =
      child.type === "element" &&
      (child as { tagName?: string }).tagName === "p";
    const unwrap = !node.spread && isP;
    if (!unwrap || i !== 0) children.push(newline());
    if (unwrap) {
      children.push(...(child as { children: ElementContent[] }).children);
    } else {
      children.push(child);
    }
    lastChildUnwrapped = unwrap;
  }

  if (!lastChildUnwrapped && children.length > 0) children.push(newline());

  const properties = mergeHProperties({}, node.data?.hProperties);
  const result: ElementContent = {
    type: "element",
    tagName: "dd",
    properties,
    children
  };
  state.patch(node, result);
  return result;
};

export const defListHastHandlers = {
  defList: defList2hast,
  defListTerm: defListTerm2hast,
  defListDescription: defListDescription2hast
} as const;
