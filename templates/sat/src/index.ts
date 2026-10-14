import {
  defineMdastPlugin,
  type MdastPluginInstance,
  type PluginFactoryContext
} from "satteri";

/** Options for the {@link satteriPlugin} plugin. */
export interface PluginOptions {}

type TextVisitor = NonNullable<MdastPluginInstance["text"]>;

/**
 * The plugin's definition. List only the keys the plugin defines, with
 * synchronous visitors: Sätteri infers whether `markdownToHtml` returns a
 * Promise from every key of a plugin's type, so typing it as
 * `MdastPluginDefinition` (whose optional visitors may be async) would make the
 * result `Result | Promise<Result>`.
 */
export interface Plugin {
  name: string;
  text: (...args: Parameters<TextVisitor>) => void;
}

/**
 * Sätteri plugin for <name> syntax. A factory, so per-document state resets for
 * every compile. Use `defineHastPlugin` for a hast-only feature.
 */
export const satteriPlugin =
  (_options: PluginOptions = {}): ((ctx: PluginFactoryContext) => Plugin) =>
  () =>
    defineMdastPlugin({
      name: "<name>",
      text(_node, _ctx) {}
    });
