// This plugin hands Sätteri's nodes to core's mdast recognition and back; the type assertions bridging Sätteri's `MdastTarget` and mdast are reviewed and intentional, so the rule is disabled file-wide, as in sat-tabs.
/* oxlint-disable typescript/no-unsafe-type-assertion */
import { editableTree, processCaptions } from "@mirrordown/core";
import type { Root } from "mdast";
import {
  defineMdastPlugin,
  type MdastPluginInstance,
  type MdastTarget,
  type PluginFactoryContext
} from "satteri";

type BeforeHook = NonNullable<MdastPluginInstance["before"]>;

/**
 * The plugin's definition: only the keys it defines, with a synchronous hook, so `markdownToHtml` returns its result directly.
 */
export interface CaptionPlugin {
  name: string;
  options: { position: boolean };
  before: (...args: Parameters<BeforeHook>) => void;
}

/**
 * Sätteri plugin that captions a block with a `~:` line right after it: the block goes in a `<figure class="markdown-caption">` whose `<figcaption>` holds the caption, as `@mirrordown/remd-caption` and `@mirrordown/mdit-caption` render it. List it after the container plugins (tabs, steps, alerts): Sätteri reads attribute blocks itself, and those ending a caption go on the figure. Recognition is shared with the remark plugin through `@mirrordown/core`; the figures render through `hName` nodes.
 */
export const satteriCaption =
  (): ((ctx: PluginFactoryContext) => CaptionPlugin) =>
  ({ source }) =>
    defineMdastPlugin({
      name: `caption`,
      // Caption lines are found and placed by their source lines.
      options: { position: true },
      before(root, ctx) {
        if (!source.includes(`~:`)) return;
        const { tree, writeBack } = editableTree<MdastTarget>(
          root,
          // A node recognition created (a figure, its caption, a rebuilt line of text), with any copied nodes inside it written back.
          (node, back) =>
            `children` in node
              ? ({ ...node, children: node.children.map(back) } as MdastTarget)
              : node,
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
        processCaptions(tree as unknown as Root, source);
        writeBack(tree);
      }
    });
