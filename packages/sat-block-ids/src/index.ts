// This plugin hands Sätteri's nodes to core's mdast recognition; the type assertions bridging Sätteri's `MdastTarget` and mdast are reviewed and intentional, so the rule is disabled file-wide, as in sat-caption.
/* oxlint-disable typescript/no-unsafe-type-assertion */
import { processBlockIds } from "@mirrordown/core";
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
 * Sätteri plugin for Obsidian's block identifiers: `^id` at the very end of a paragraph, a heading or an alert's title is removed, and the block it names gets the `id` `^id`, as `@mirrordown/remd-block-ids` and `@mirrordown/mdit-block-ids` give it. List it after the plugins that build tab panels and steps (sat-tabs, sat-steps) and before sat-github-alerts (whose alerts keep no position, so after it a title's line can't be read), sat-abbr and sat-caption; Sätteri reads attribute blocks itself, before any plugin, and an id written with one is the block's. Recognition is shared with the remark plugin through `@mirrordown/core`.
 */
export const satteriBlockIds =
  (): ((ctx: PluginFactoryContext) => BlockIdsPlugin) =>
  ({ source }) =>
    defineMdastPlugin({
      name: `block-ids`,
      // Positions tell an escaped `^`, and a marker with spaces after it on its line, from a real one.
      options: { position: true },
      // Recognition reads the tree as it is and changes it through Sätteri's own calls, rather than through a copy: a copy is made and written back recursively, which quotes nested thousands deep overflow.
      before(root, ctx) {
        processBlockIds(root as unknown as Root, source, {
          setChildren: (node, children) => {
            ctx.setProperty(
              node as MdastTarget,
              `children`,
              children as MdastTarget[]
            );
          },
          setData: (node, data) => {
            ctx.setProperty(node as MdastTarget, `data`, data);
          }
        });
      }
    });
