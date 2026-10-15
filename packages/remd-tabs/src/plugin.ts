// The hast handlers bridge mdast/hast types that don't unify cleanly; the assertions are reviewed and intentional.
/* oxlint-disable typescript/no-unsafe-type-assertion */
import type { Plugin } from "unified";
import type { Root } from "mdast";
import type { Element, ElementContent, Properties } from "hast";
import type { State, Handler } from "mdast-util-to-hast";
import {
  processTabs,
  stripAttrs,
  tabLabelText,
  tabsBlockId,
  type TabsLabelNode
} from "@mirrordown/core";
import type { TabsOptions, TabsListNode } from "./types.js";

export type { TabsOptions };

/** remark plugin for tabbed content blocks, rendered via {@link tabsHastHandlers}. */
export const remarkTabs: Plugin<[TabsOptions?], Root> = function (
  options = {}
) {
  const { containerClass = "markdown-tabs" } = options;

  // Recognition is shared with the Sätteri plugin through `@mirrordown/core`; it also finds tabs nested inside step bodies and other block containers.
  return (tree, file) => {
    processTabs(tree, containerClass, String(file));
  };
};

// ── HAST handlers ─────────────────────────────────────────────────────────────

const mergeHProperties = (base: Properties, extra?: Properties): Properties => {
  if (!extra) return base;
  const { class: extraClass, ...rest } = extra;
  const result: Properties = { ...base, ...rest };
  if (extraClass)
    result.class = base.class
      ? `${String(base.class)} ${String(extraClass)}`
      : extraClass;
  return result;
};

// Each document's tab groups, counted as they render (in the order they open), for their block ids.
const groupsRendered = new WeakMap<State, number>();

const buildTabsHast = (
  list: TabsListNode,
  containerClass: string,
  state: State
): Element => {
  const index = groupsRendered.get(state) ?? 0;
  groupsRendered.set(state, index + 1);
  const blockId = tabsBlockId(index, list.groupId);
  const labelChildren: ElementContent[] = [];
  const panelChildren: ElementContent[] = [];

  list.children.forEach((item, idx) => {
    const label =
      item.children.find((c): c is TabsLabelNode => c.type === "tabsLabel")
        ?.children ?? [];
    // From the label as it is now, so plugins that ran after tabs count too.
    const labelPlain = stripAttrs(tabLabelText(label));
    const inputId = `${blockId}-${idx}`;

    // <input type="radio">
    const inputProps: Properties = {
      type: "radio",
      name: blockId,
      id: inputId,
      hidden: true,
      ...(item.open ? { checked: true } : {})
    };
    labelChildren.push({
      type: "element",
      tagName: "input",
      properties: inputProps,
      children: []
    });

    // <label>
    const labelProps = mergeHProperties(
      { class: `${containerClass}-label`, for: inputId },
      item.data?.hProperties
    );
    labelChildren.push({
      type: "element",
      tagName: "label",
      properties: labelProps,
      children: state.all({
        type: "paragraph",
        children: label
      })
    });

    // Panel body and nested lists
    // The panel's body and nested groups, in order: content can follow a nested group.
    const sectionChildren: ElementContent[] = [];
    let blocks: typeof item.children = [];
    const flush = (): void => {
      if (blocks.length > 0) {
        sectionChildren.push(
          ...state.all({
            type: "root",
            children: blocks
          })
        );
      }
      blocks = [];
    };
    for (const child of item.children) {
      if (child.type === "tabsLabel") continue;
      if (child.type === "tabsList") {
        flush();
        sectionChildren.push(
          buildTabsHast(child, child.containerClass ?? containerClass, state)
        );
      } else {
        blocks.push(child);
      }
    }
    flush();

    // <section>
    const sectionProps = mergeHProperties(
      { class: `${containerClass}-panel`, "aria-label": labelPlain },
      undefined
    );
    panelChildren.push({
      type: "element",
      tagName: "section",
      properties: sectionProps,
      children: sectionChildren
    });
  });

  // <div class="...-labels">
  const labelsDiv: Element = {
    type: "element",
    tagName: "div",
    properties: { class: `${containerClass}-labels` },
    children: labelChildren
  };

  // <div class="...-panels">
  const panelsDiv: Element = {
    type: "element",
    tagName: "div",
    properties: { class: `${containerClass}-panels` },
    children: panelChildren
  };

  // <div> container
  const divProps = mergeHProperties(
    { class: containerClass, "data-tabs-group": list.groupId },
    list.data?.hProperties
  );

  const result: Element = {
    type: "element",
    tagName: "div",
    properties: divProps,
    children: [labelsDiv, panelsDiv]
  };

  state.patch(list, result);
  return result;
};

/** mdast-to-hast handler for tabs nodes, for use with `remark-rehype`. */
export const tabsHastHandlers: Record<string, Handler> = {
  tabsList(state: State, node: TabsListNode): ElementContent {
    const containerClass = node.containerClass ?? "markdown-tabs";
    return buildTabsHast(node, containerClass, state);
  }
};
