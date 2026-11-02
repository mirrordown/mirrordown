import {
  COPY_CODE_ICONS,
  COPY_CODE_TEXT,
  copyCodeBlock,
  copyCodeIds,
  copyCodeOptedOut,
  createCopyCodeButton,
  type CopyCodeOptions,
  type CopyCodeState
} from "@mirrordown/core";
import {
  defineHastPlugin,
  type HastVisitorInstance,
  type PluginFactoryContext
} from "satteri";

export type { CopyCodeOptions, CopyCodeState };
export { COPY_CODE_ICONS, COPY_CODE_TEXT };

type ElementVisitor = Extract<
  NonNullable<HastVisitorInstance["element"]>,
  { filter: string[] }
>;

/**
 * The plugin's definition: only the keys it defines, with a synchronous visitor, so `markdownToHtml` returns its result directly.
 */
export interface CopyCodePlugin {
  name: string;
  element: {
    filter: string[];
    visit: (...args: Parameters<ElementVisitor["visit"]>) => void;
  };
}

/**
 * Sätteri plugin that adds a copy button to each code block, in its `<pre>` after the `<code>`: a `<button class="markdown-copy-code">` sending the `--copy` invoker command to the block's `<pre>`, which takes an id from a hash of its text. The button is a `raw` node, so it reaches the HTML exactly as the markdown-it and rehype plugins write it. The buttons render `hidden`; the client script (`@mirrordown/sat-copy-code/client`) copies and shows them. ` ```sh nocopy ` leaves a block without one. Options set the button's icons and text. List it after plugins that replace code blocks, such as mermaid-pele. A factory, so each document's ids start fresh. The ids and the button are shared with the markdown-it and rehype plugins through `@mirrordown/core`.
 */
export const satteriCopyCode = (
  options: CopyCodeOptions = {}
): ((ctx: PluginFactoryContext) => CopyCodePlugin) => {
  const copyCodeButton = createCopyCodeButton(options);
  return () => {
    const ids = copyCodeIds();
    return defineHastPlugin({
      name: `copy-code`,
      element: {
        filter: [`pre`],
        visit(node, ctx) {
          const block = copyCodeBlock(node);
          if (!block || copyCodeOptedOut(block.meta)) return;
          const id = ids(block.text);
          ctx.setProperty(node, `id`, id);
          ctx.appendChild(node, { type: `raw`, value: copyCodeButton(id) });
        }
      }
    });
  };
};
