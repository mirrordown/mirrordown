// This plugin hands Sätteri's nodes to core's mdast recognition and back; the type assertions bridging Sätteri's `MdastTarget`, mdast and the step node types are reviewed and intentional, so the rule is disabled file-wide, as in remd-steps.
/* oxlint-disable typescript/no-unsafe-type-assertion */
import {
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

// A step header: `@1.` to `@@@@@@1.` at the start of a line.
const MAYBE_STEPS = /^[ \t>]*@{1,6}\d+\./m;

// A mutable, plain copy of a node and its descendants: recognition rewrites children in place, and Sätteri's own nodes are read-only.
const copy = (node: MdastTarget): MdastTarget =>
  `children` in node
    ? ({ ...node, children: node.children.map(copy) } as MdastTarget)
    : { ...node };

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

    const renderItem = (item: StepsItemNode): Custom => {
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
                    render
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
                  children: body.map(render)
                }
              ]
            : []),
          ...nested.map(render)
        ]
      };
    };

    const renderList = (list: StepsListNode): Custom => ({
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
      children: list.children.map(renderItem)
    });

    // Render the recognized lists, wherever they sit, as `hName` nodes.
    function render(node: MdastTarget): MdastTarget {
      if (node.type === `stepsList`) {
        return renderList(node as unknown as StepsListNode);
      }
      return `children` in node
        ? ({ ...node, children: node.children.map(render) } as MdastTarget)
        : node;
    }

    const found = (node: MdastTarget): boolean =>
      node.type === `stepsList` ||
      (`children` in node && node.children.some(found));

    return defineMdastPlugin({
      name: `steps`,
      // Recognition keeps the source lines of paragraphs left over after a group.
      options: { position: true },
      before(root, ctx) {
        if (!MAYBE_STEPS.test(source)) return;
        const tree = copy(root) as unknown as Root;
        processSteps(tree, containerClass);
        const children = tree.children as unknown as MdastTarget[];
        if (!children.some(found)) return;
        ctx.setProperty(root, `children`, children.map(render));
      }
    });
  };
