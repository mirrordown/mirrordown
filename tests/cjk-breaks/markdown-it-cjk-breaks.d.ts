// `markdown-it-cjk-breaks` ships no types. It is used only by `reference.test.ts`, as the plugin it is: one function taking the markdown-it instance.
declare module "markdown-it-cjk-breaks" {
  import type { PluginSimple } from "markdown-it";

  const cjkBreaks: PluginSimple;
  export default cjkBreaks;
}
