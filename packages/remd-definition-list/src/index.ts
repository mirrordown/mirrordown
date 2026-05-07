import { u } from "unist-builder";
import type { Plugin } from "unified";
import type { Root } from "mdast";
import type { ElementContent, Properties } from "hast";
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

const newline = () => u("text", "\n") as ElementContent;

const mergeHProperties = (base: Properties, extra?: Record<string, unknown>): Properties => {
  if (!extra) return base;
  const { class: extraClass, ...rest } = extra;
  const result: Properties = { ...base, ...(rest as Properties) };
  if (extraClass)
    result.class = base.class ? `${String(base.class)} ${String(extraClass)}` : String(extraClass);
  return result;
};

const defList2hast = (state: State, node: DefinitionList): ElementContent => {
  const items = state.all(node);
  const children: ElementContent[] =
    items.length > 0 ? [...items.flatMap((item) => [newline(), item]), newline()] : [];
  const properties = mergeHProperties({}, node.data?.hProperties as Properties | undefined);
  const result: ElementContent = { type: "element", tagName: "dl", properties, children };
  state.patch(node, result);
  return result;
};

const defListTerm2hast = (state: State, node: DefinitionTerm): ElementContent => {
  const properties = mergeHProperties({}, node.data?.hProperties as Properties | undefined);
  const result: ElementContent = {
    type: "element",
    tagName: "dt",
    properties,
    children: state.all(node),
  };
  state.patch(node, result);
  return result;
};

const defListDescription2hast = (state: State, node: DefinitionDescription): ElementContent => {
  const rawChildren = state.all(node);
  const children: ElementContent[] = [];
  let lastChildUnwrapped = false;

  for (let i = 0; i < rawChildren.length; i++) {
    const child = rawChildren[i];
    const isP = child.type === "element" && (child as { tagName?: string }).tagName === "p";
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

  const properties = mergeHProperties({}, node.data?.hProperties as Properties | undefined);
  const result: ElementContent = { type: "element", tagName: "dd", properties, children };
  state.patch(node, result);
  return result;
};

export const defListHastHandlers = {
  defList: defList2hast,
  defListTerm: defListTerm2hast,
  defListDescription: defListDescription2hast,
} as const;
