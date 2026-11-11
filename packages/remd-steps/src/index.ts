// The hast handler bridges mdast/hast types that don't unify cleanly; the assertions are reviewed and intentional.
/* oxlint-disable typescript/no-unsafe-type-assertion */
import type { Plugin } from "unified";
import type { Root, RootContent } from "mdast";
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

// An author class joins the element's own, whichever name a plugin set it by (`class`, as remd-attrs does, or hast's `className`): left beside it, the element would get two class attributes. Other author properties are added after the element's.
const withAuthorProperties = (
  own: Properties & { class: string },
  author: Properties | undefined
): Properties => {
  if (!author) return own;
  const { class: extraClass, className: extraClassName, ...rest } = author;
  const extra = [extraClass, extraClassName]
    .flat()
    .filter(
      (value): value is string => typeof value === "string" && value !== ""
    );
  return { ...own, class: [own.class, ...extra].join(" "), ...rest };
};

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
    // A title attrs emptied (it held only an attribute block) is no title, like a step written without one.
    const titled = title?.children.some(
      (c) => c.type !== "text" || c.value !== ""
    );
    if (title && titled) {
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

    // A step's `@@` sub-steps render after its body; a group written in the body stays in it.
    const isSubSteps = (c: { type: string }): boolean =>
      c.type === "stepsList" && !(c as StepsListNode).inBody;
    const bodyBlocks = item.children.filter(
      (c): c is Exclude<typeof c, StepsTitleNode> =>
        c.type !== "stepsTitle" && !isSubSteps(c)
    );
    const nestedLists = item.children.filter((c) =>
      isSubSteps(c)
    ) as unknown as StepsListNode[];

    if (bodyBlocks.length > 0) {
      liChildren.push({
        type: "element",
        tagName: "div",
        properties: { class: `${containerClass}-body` },
        children: state.all({
          type: "root",
          // A group written in the body is a `stepsList`, which `stepsHastHandlers` renders.
          children: bodyBlocks as unknown as RootContent[]
        })
      });
    }

    for (const nested of nestedLists) {
      liChildren.push(buildListHast(nested, containerClass, state));
    }

    const liProps = withAuthorProperties(
      {
        class: `${containerClass}-item`,
        "data-step": String(item.number)
      },
      item.data?.hProperties
    );

    return {
      type: "element",
      tagName: "li",
      properties: liProps,
      children: liChildren
    } satisfies Element;
  });

  const baseClass =
    list.depth === 1 ? containerClass : `${containerClass}-list`;
  const olProps = withAuthorProperties(
    { class: baseClass },
    list.data?.hProperties
  );

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
