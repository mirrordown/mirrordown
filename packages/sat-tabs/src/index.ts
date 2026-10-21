// This plugin hands Sätteri's nodes to core's mdast recognition and back; the type assertions bridging Sätteri's `MdastTarget`, mdast and the tab node types are reviewed and intentional, so the rule is disabled file-wide, as in remd-tabs.
/* oxlint-disable typescript/no-unsafe-type-assertion */
import {
  editableTree,
  placeCutAttributes,
  processTabs,
  stripAttrs,
  tabLabelText,
  tabsBlockId,
  type TabsItemNode,
  type TabsLabelNode,
  type TabsListNode,
  type ReadAttributes
} from "@mirrordown/core";
import type { Root } from "mdast";
import {
  defineMdastPlugin,
  markdownToMdast,
  type Custom,
  type Features,
  type MdastPluginInstance,
  type MdastTarget,
  type PluginFactoryContext
} from "satteri";

type BeforeHook = NonNullable<MdastPluginInstance["before"]>;

// An attribute block as Sätteri reads one after text: the properties it gives the paragraph, if all of it is one.
const readAttributes: ReadAttributes = (block) => {
  const root = markdownToMdast(`x ${block}`, {
    // Published Sätteri versions without `attributes` don't type it; they never get here.
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    features: { attributes: true } as Features
  }) as unknown as Root;
  const para = root.children[0];
  const text = para?.type === `paragraph` ? para.children : [];
  return text.length === 1 && text[0]?.type === `text` && text[0].value === `x`
    ? (para?.data as { hProperties?: ReturnType<ReadAttributes> } | undefined)
        ?.hProperties
    : undefined;
};

/** Options for the {@link satteriTabs} plugin. */
export interface TabsOptions {
  /** Class applied to the tabs container element (default `markdown-tabs`). */
  containerClass?: string;
}

/**
 * The plugin's definition: only the keys it defines, with a synchronous hook, so `markdownToHtml` returns its result directly.
 */
export interface TabsPlugin {
  name: string;
  options: { position: boolean };
  before: (...args: Parameters<BeforeHook>) => void;
}

// A tab header (`%` to `%%%%%%`, optionally `+`, then a space) anywhere: headers can follow blockquote markers and list markers.
const MAYBE_TABS = /%{1,6}\+? /;

// An author class (from attrs) joins the element's own; other author properties are added after the element's.
const withAuthorProperties = (
  own: Record<string, unknown> & { className: string[] },
  author: Record<string, unknown> | undefined
): Record<string, unknown> => {
  if (!author) return own;
  const { class: extraClass, className: extraClassName, ...rest } = author;
  const extra = [extraClass, extraClassName]
    .flat()
    .filter(
      (value): value is string => typeof value === `string` && value !== ``
    );
  return { ...own, className: [...own.className, ...extra], ...rest };
};

const element = (
  type: string,
  hName: string,
  hProperties: Record<string, unknown>,
  children: MdastTarget[]
): Custom => ({ type, data: { hName, hProperties }, children });

/**
 * Sätteri plugin for tabbed content blocks (`% Label` lines with `>` bodies), rendering the same radio-input tabs as `@mirrordown/remd-tabs` and `@mirrordown/mdit-tabs`. Recognition is shared with the remark plugin through `@mirrordown/core`; Sätteri has no hast handler hook, so the tabs render through `hName` nodes.
 */
export const satteriTabs =
  (options: TabsOptions = {}): ((ctx: PluginFactoryContext) => TabsPlugin) =>
  (factory) => {
    const { source } = factory;
    // Sätteri reads attribute blocks before plugins run; the document's features say whether it does (Sätteri versions that expose them).
    const attributes =
      (factory as { features?: { attributes?: boolean } }).features
        ?.attributes === true;
    const { containerClass = `markdown-tabs` } = options;

    // `back` writes copied nodes back as Sätteri's own (see `editableTree`).
    type Back = (node: MdastTarget) => MdastTarget;

    // This document's tab groups, counted as they render (in the order they open), for their block ids.
    let groupsRendered = 0;

    const renderList = (list: TabsListNode, back: Back): Custom => {
      const cc = list.containerClass ?? containerClass;
      const blockId = tabsBlockId(groupsRendered++, list.groupId);
      const labels: MdastTarget[] = [];
      const panels: MdastTarget[] = [];
      for (const [idx, item] of list.children.entries()) {
        const label =
          item.children.find(
            (child): child is TabsLabelNode => child.type === `tabsLabel`
          )?.children ?? [];
        const inputId = `${blockId}-${idx}`;
        labels.push(
          element(
            `tabsInput`,
            `input`,
            {
              type: `radio`,
              name: blockId,
              id: inputId,
              hidden: true,
              ...(item.open ? { checked: true } : {})
            },
            []
          ),
          element(
            `tabsLabel`,
            `label`,
            withAuthorProperties(
              { className: [`${cc}-label`], htmlFor: inputId },
              item.data?.hProperties
            ),
            (label as unknown as MdastTarget[]).map(back)
          )
        );
        panels.push(renderPanel(item, cc, label, back));
      }
      return element(
        `tabsList`,
        `div`,
        withAuthorProperties(
          { className: [cc], dataTabsGroup: list.groupId },
          list.data?.hProperties
        ),
        [
          element(`tabsLabels`, `div`, { className: [`${cc}-labels`] }, labels),
          element(`tabsPanels`, `div`, { className: [`${cc}-panels`] }, panels)
        ]
      );
    };

    const renderPanel = (
      item: TabsItemNode,
      cc: string,
      label: TabsLabelNode["children"],
      back: Back
    ): Custom => {
      // The panel's body and nested groups, in order: content can follow a nested group.
      const content = (item.children as unknown as MdastTarget[]).filter(
        (child) => child.type !== `tabsLabel`
      );
      return element(
        `tabsPanel`,
        `section`,
        // From the label as it is now, so plugins that ran after tabs count too.
        {
          className: [`${cc}-panel`],
          ariaLabel: stripAttrs(tabLabelText(label))
        },
        content.map(back)
      );
    };

    // A node recognition created: tabs render as `hName` nodes, anything else (paragraphs split around a group) as it is.
    const build = (node: MdastTarget, back: Back): MdastTarget =>
      node.type === `tabsList`
        ? renderList(node as unknown as TabsListNode, back)
        : `children` in node
          ? ({ ...node, children: node.children.map(back) } as MdastTarget)
          : node;

    return defineMdastPlugin({
      name: `tabs`,
      // Group ids hash a group's start line, and leftover paragraphs keep their source lines.
      options: { position: true },
      before(root, ctx) {
        if (!MAYBE_TABS.test(source)) return;
        const { tree, writeBack } = editableTree<MdastTarget>(
          root,
          build,
          (node, children) => {
            ctx.setProperty(node, `children`, children);
          },
          (node, data) => {
            ctx.setProperty(
              node,
              `data`,
              data as Record<string, unknown> | null
            );
          }
        );
        processTabs(tree as unknown as Root, containerClass, source);
        // Blocks a lazily continued header hid from Sätteri end their paragraphs now.
        if (attributes)
          placeCutAttributes(
            tree as unknown as Root,
            source.split(/\r?\n/),
            readAttributes
          );
        writeBack(tree);
      }
    });
  };
