// This plugin hands Sätteri's nodes to core's mdast recognition and back; the type assertions bridging Sätteri's `MdastTarget` and mdast are reviewed and intentional, so the rule is disabled file-wide, as in sat-caption.
/* oxlint-disable typescript/no-unsafe-type-assertion */
import { editableTree, processBlockIds } from "@mirrordown/core";
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
export interface BlockIdsPlugin {
  name: string;
  options: { position: boolean };
  before: (...args: Parameters<BeforeHook>) => void;
}

/**
 * Sätteri plugin for Obsidian's block identifiers: `^id` at the very end of a paragraph, a heading or an alert's title is removed, and the block it names gets the `id` `^id`, as `@mirrordown/remd-block-ids` and `@mirrordown/mdit-block-ids` give it. List it after the plugins that build tab panels and steps (sat-tabs, sat-steps) and before sat-github-alerts and sat-caption; Sätteri reads attribute blocks itself, before any plugin, and an id written with one is the block's. Recognition is shared with the remark plugin through `@mirrordown/core`.
 */
export const satteriBlockIds =
  (): ((ctx: PluginFactoryContext) => BlockIdsPlugin) =>
  ({ source }) =>
    defineMdastPlugin({
      name: `block-ids`,
      // Positions tell an escaped `^`, and a marker with spaces after it on its line, from a real one.
      options: { position: true },
      before(root, ctx) {
        if (!source.includes(`^`)) return;
        const { tree, writeBack } = editableTree<MdastTarget>(
          root,
          // A node recognition created (a shortened line of text, an alert's title restored), with any copied nodes inside it written back.
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
        processBlockIds(tree as unknown as Root, source);
        writeBack(tree);
      }
    });
