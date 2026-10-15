// The hast handler bridges mdast/hast types that don't unify cleanly; the assertions are reviewed and intentional.
/* oxlint-disable typescript/no-unsafe-type-assertion */
import type { Plugin } from "unified";
import type { Root } from "mdast";
import type { Element, ElementContent, Properties } from "hast";
import type { State, Handler } from "mdast-util-to-hast";
import {
  processSteps,
  type StepsListNode,
  type StepsTitleNode
} from "@mirrordown/core";
import type { StepsOptions } from "./types.js";

export type { StepsOptions };

/** remark plugin for numbered step sequences, rendering ordered step lists via {@link stepsHastHandlers}. */
export const remarkSteps: Plugin<[StepsOptions?], Root> = function (
  options = {}
) {
  const { containerClass = "markdown-steps" } = options;

  // Recognition is shared with the Sätteri plugin through `@mirrordown/core`; it also finds steps nested inside tab bodies and other block containers.
  return (tree, file) => {
    processSteps(tree, containerClass, String(file));
  };
};

// ── HAST handlers ─────────────────────────────────────────────────────────────

const buildListHast = (
  list: StepsListNode,
  containerClass: string,
  state: State
): Element => {
  const items: ElementContent[] = list.children.map((item) => {
    const liChildren: ElementContent[] = [];

    const title = item.children.find(
      (c): c is StepsTitleNode => c.type === "stepsTitle"
    );
    if (title && title.children.length > 0) {
      liChildren.push({
        type: "element",
        tagName: "p",
        properties: { class: `${containerClass}-title` },
        children: state.all({
          type: "paragraph",
          children: title.children
        })
      });
    }

    const bodyBlocks = item.children.filter(
      (c) => c.type !== "stepsTitle" && c.type !== "stepsList"
    );
    const nestedLists = item.children.filter(
      (c) => (c as unknown as { type: string }).type === "stepsList"
    ) as unknown as StepsListNode[];

    if (bodyBlocks.length > 0) {
      liChildren.push({
        type: "element",
        tagName: "div",
        properties: { class: `${containerClass}-body` },
        children: state.all({
          type: "root",
          children: bodyBlocks
        })
      });
    }

    for (const nested of nestedLists) {
      liChildren.push(buildListHast(nested, containerClass, state));
    }

    const liProps: Properties = {
      class: `${containerClass}-item`,
      "data-step": String(item.number)
    };
    if (item.data?.hProperties) {
      const { class: extraClass, ...rest } = item.data.hProperties;
      if (extraClass)
        liProps.class = `${String(liProps.class)} ${String(extraClass)}`;
      Object.assign(liProps, rest);
    }

    return {
      type: "element",
      tagName: "li",
      properties: liProps,
      children: liChildren
    } satisfies Element;
  });

  const baseClass =
    list.depth === 1 ? containerClass : `${containerClass}-list`;
  const olProps: Properties = { class: baseClass };
  if (list.data?.hProperties) {
    const { class: extraClass, ...rest } = list.data.hProperties;
    if (extraClass)
      olProps.class = `${String(olProps.class)} ${String(extraClass)}`;
    Object.assign(olProps, rest);
  }

  return {
    type: "element",
    tagName: "ol",
    properties: olProps,
    children: items
  };
};

/** mdast-to-hast handler for steps nodes, for use with `remark-rehype`. */
export const stepsHastHandlers: Record<string, Handler> = {
  stepsList(state: State, node: StepsListNode): ElementContent {
    const containerClass = node.containerClass ?? "markdown-steps";
    const result = buildListHast(node, containerClass, state);
    state.patch(node as unknown as Parameters<typeof state.patch>[0], result);
    return result;
  }
};
