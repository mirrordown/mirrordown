import type { PluginWithOptions } from "markdown-it";
import {
  COPY_CODE_ICONS,
  COPY_CODE_TEXT,
  copyCodeIds,
  copyCodeOptedOut,
  copyCodeText,
  createCopyCodeButton,
  type CopyCodeOptions,
  type CopyCodeState
} from "@mirrordown/core";

export type { CopyCodeOptions, CopyCodeState };
export { COPY_CODE_ICONS, COPY_CODE_TEXT };

// The document's id generator, on the render environment: a core rule starts a fresh one for each document.
const IDS = Symbol(`copyCodeIds`);
interface CopyCodeEnv {
  [IDS]?: (text: string) => string;
}

/**
 * markdown-it plugin that adds a copy button to each code block, fenced or indented, in its `<pre>` after the `<code>`: a `<button class="markdown-copy-code">` sending the `--copy` invoker command to the block's `<pre>`, which takes an id from a hash of its text. The buttons render `hidden`; the client script (`@mirrordown/mdit-copy-code/client`) copies and shows them. ` ```sh nocopy ` leaves a block without one, and a block another plugin renders as something else (such as a mermaid diagram) gets none. Options set the button's icons and text. The ids and the button are shared with the rehype and Sätteri plugins through `@mirrordown/core`.
 */
export const copyCode: PluginWithOptions<CopyCodeOptions> = (
  md,
  options = {}
) => {
  type RenderRule = NonNullable<typeof md.renderer.rules.fence>;
  const copyCodeButton = createCopyCodeButton(options);

  md.core.ruler.push(`copy_code`, (state) => {
    const env: CopyCodeEnv = state.env;
    env[IDS] = copyCodeIds();
  });

  const withButton =
    (
      rule: RenderRule | undefined,
      meta: (info: string) => string
    ): RenderRule =>
    (tokens, idx, opts, env: CopyCodeEnv, self): string => {
      const html = rule
        ? rule(tokens, idx, opts, env, self)
        : self.renderToken(tokens, idx, opts);
      const token = tokens[idx];
      const ids = env[IDS];
      if (!token || !ids || !html.startsWith(`<pre`)) return html;
      if (copyCodeOptedOut(meta(md.utils.unescapeAll(token.info)))) return html;
      const text = copyCodeText(token.content);
      if (text === ``) return html;
      const id = ids(text);
      return `<pre id="${id}"${html.slice(4).replace(/<\/pre>\n?$/, `${copyCodeButton(id)}</pre>\n`)}`;
    };

  // A fence's meta is its info string after the language.
  md.renderer.rules.fence = withButton(md.renderer.rules.fence, (info) =>
    info.trim().split(/\s+/).slice(1).join(` `)
  );
  md.renderer.rules.code_block = withButton(
    md.renderer.rules.code_block,
    () => ``
  );
};
