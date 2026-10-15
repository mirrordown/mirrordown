// This plugin hands Sätteri's nodes to core's mdast recognition and back; the type assertions bridging Sätteri's `MdastTarget`, mdast and the step node types are reviewed and intentional, so the rule is disabled file-wide, as in remd-steps.
/* oxlint-disable typescript/no-unsafe-type-assertion */
import {
  editableTree,
  processSteps,
  type StepsItemNode,
  type StepsListNode,
  type StepsTitleNode
} from "@mirrordown/core";
import type { Root } from "mdast";
import {
  defineMdastPlugin,
  type Custom,
  type MdastPluginInstance,
  type MdastTarget,
  type PluginFactoryContext
} from "satteri";

type BeforeHook = NonNullable<MdastPluginInstance["before"]>;

/** Options for the {@link satteriSteps} plugin. */
export interface StepsOptions {
  /** Class applied to the steps container element (default `markdown-steps`). */
  containerClass?: string;
}

/**
 * The plugin's definition: only the keys it defines, with a synchronous hook, so `markdownToHtml` returns its result directly.
 */
export interface StepsPlugin {
  name: string;
  options: { position: boolean };
  before: (...args: Parameters<BeforeHook>) => void;
}

// A step header (`@1.` to `@@@@@@1.`) anywhere: headers can follow blockquote markers and list markers.
const MAYBE_STEPS = /@{1,6}\d+\./;

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

/**
 * Sätteri plugin for numbered step sequences (`@1. Title` lines with `>` bodies), rendering the same ordered step lists as `@mirrordown/remd-steps` and `@mirrordown/mdit-steps`. Recognition is shared with the remark plugin through `@mirrordown/core`; Sätteri has no hast handler hook, so the lists render through `hName` nodes.
 */
export const satteriSteps =
  (options: StepsOptions = {}): ((ctx: PluginFactoryContext) => StepsPlugin) =>
  ({ source }) => {
    const { containerClass = `markdown-steps` } = options;

    // `back` writes copied nodes back as Sätteri's own (see `editableTree`).
    type Back = (node: MdastTarget) => MdastTarget;

    const renderItem = (item: StepsItemNode, back: Back): Custom => {
      const title = item.children.find(
        (child): child is StepsTitleNode => child.type === `stepsTitle`
      );
      const nodes = item.children as unknown as MdastTarget[];
      const body = nodes.filter(
        (child) => child.type !== `stepsTitle` && child.type !== `stepsList`
      );
      const nested = nodes.filter((child) => child.type === `stepsList`);
      return {
        type: `stepsItem`,
        data: {
          hName: `li`,
          hProperties: withAuthorProperties(
            {
              className: [`${containerClass}-item`],
              dataStep: String(item.number)
            },
            item.data?.hProperties
          )
        },
        children: [
          ...(title && title.children.length > 0
            ? [
                {
                  type: `stepsTitle`,
                  data: {
                    hName: `p`,
                    hProperties: { className: [`${containerClass}-title`] }
                  },
                  children: (title.children as unknown as MdastTarget[]).map(
                    back
                  )
                }
              ]
            : []),
          ...(body.length > 0
            ? [
                {
                  type: `stepsBody`,
                  data: {
                    hName: `div`,
                    hProperties: { className: [`${containerClass}-body`] }
                  },
                  children: body.map(back)
                }
              ]
            : []),
          ...nested.map(back)
        ]
      };
    };

    const renderList = (list: StepsListNode, back: Back): Custom => ({
      type: `stepsList`,
      data: {
        hName: `ol`,
        hProperties: withAuthorProperties(
          {
            className: [
              list.depth === 1 ? containerClass : `${containerClass}-list`
            ]
          },
          list.data?.hProperties
        )
      },
      children: list.children.map((item) => renderItem(item, back))
    });

    // A node recognition created: step lists render as `hName` nodes, anything else (paragraphs left over after a group) as it is.
    const build = (node: MdastTarget, back: Back): MdastTarget =>
      node.type === `stepsList`
        ? renderList(node as unknown as StepsListNode, back)
        : `children` in node
          ? ({ ...node, children: node.children.map(back) } as MdastTarget)
          : node;

    return defineMdastPlugin({
      name: `steps`,
      // Recognition keeps the source lines of paragraphs left over after a group.
      options: { position: true },
      before(root, ctx) {
        if (!MAYBE_STEPS.test(source)) return;
        const { tree, writeBack } = editableTree<MdastTarget>(
          root,
          build,
          (node, children) => {
            ctx.setProperty(node, `children`, children);
          }
        );
        processSteps(tree as unknown as Root, containerClass);
        writeBack(tree);
      }
    });
  };
