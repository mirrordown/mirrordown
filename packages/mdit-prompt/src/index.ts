import type { PluginWithOptions } from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import {
  createPrompt,
  PROMPT_DEFAULT_SERVICES,
  PROMPT_LANGUAGE,
  PROMPT_PREVIEW_CLASS,
  PROMPT_SERVICES,
  PROMPT_TEXT,
  promptHighlight,
  promptIds,
  type PromptMarkup,
  type PromptOptions,
  type PromptService,
  type PromptTextKey
} from "@mirrordown/core/prompt";

export type { PromptOptions, PromptService, PromptTextKey };
export { PROMPT_DEFAULT_SERVICES, PROMPT_SERVICES, PROMPT_TEXT };

// The document's id generator, on the render environment: a core rule starts a fresh one for each document.
const IDS = Symbol(`promptIds`);
interface PromptEnv {
  [IDS]?: (text: string) => string;
}

// On a prompt's fence token: the token that closes its preview, which writes the rest of the prompt once the fence has built it.
const CLOSE = Symbol(`promptClose`);
interface PromptMeta {
  [CLOSE]?: Token;
  markup?: PromptMarkup;
}

const isPrompt = (info: string): boolean =>
  info.trim().split(/\s+/)[0] === PROMPT_LANGUAGE;

/**
 * markdown-it plugin that renders ` ```prompt ` fences as prompts for readers to hand to an AI: a `<div class="markdown-prompt">` holding a `<details>`, closed unless the fence's meta says `open`, whose `<summary>` is the prompt's title (`title="…"`), followed by a copy button and a button for each service the meta names (`claude`, `chatgpt`, `cursor`…, or the defaults). Opened, it shows the prompt rendered as markdown by the page's own markdown-it, plugins and all, and its markdown a click away. A service that takes the prompt in its URL gets it through a GET form, so the prompt is in no link an agent reads; others open for the reader to paste it. The prompt reads as a code block where the plugin isn't installed. A `highlight` function set on markdown-it (VitePress's Shiki) highlights the markdown view; attributes on the fence (`{#id .class}`, with markdown-it-attrs) go on the `<div>`. The client script (`@mirrordown/mdit-prompt/client`) copies. The markup is shared with the rehype and Sätteri plugins through `@mirrordown/core`.
 */
export const prompt: PluginWithOptions<PromptOptions> = (md, options = {}) => {
  const render = createPrompt(options);

  // Right after the blocks are parsed, each prompt's text is parsed too, into the tokens after its fence, so the rest of the core rules (the page's plugins among them) and the inline rules treat its preview as the page. Only the document's own fences are prompts: one inside a prompt stays a code block.
  md.core.ruler.after(`block`, `prompt`, (state) => {
    const env: PromptEnv = state.env;
    env[IDS] = promptIds();
    const tokens: Token[] = [];
    for (const token of state.tokens) {
      tokens.push(token);
      if (
        token.type !== `fence` ||
        !isPrompt(md.utils.unescapeAll(token.info)) ||
        token.content.trim() === ``
      )
        continue;
      const preview: Token[] = [];
      md.block.parse(token.content, md, state.env, preview);
      // Its lines and nesting are the page's: the prompt's text starts the line after its fence.
      const line = (token.map?.[0] ?? 0) + 1;
      for (const child of preview) {
        if (child.map) child.map = [child.map[0] + line, child.map[1] + line];
        child.level += token.level + 1;
      }
      const close = new state.Token(`prompt_close`, ``, 0);
      close.block = true;
      close.level = token.level;
      close.meta = { fence: token };
      const meta: PromptMeta = { [CLOSE]: close };
      token.meta = meta;
      tokens.push(...preview, close);
    }
    state.tokens = tokens;
  });

  const renderFence = md.renderer.rules.fence;
  md.renderer.rules.fence = (
    tokens,
    idx,
    opts,
    env: PromptEnv,
    self
  ): string => {
    const token = tokens[idx];
    const meta: PromptMeta | null = token?.meta ?? null;
    if (token && meta?.[CLOSE]) {
      const info = md.utils.unescapeAll(token.info).trim();
      // A highlighter given to markdown-it reads the prompt as markdown; one in the plugin's options takes over from it.
      const highlighted = options.highlight
        ? undefined
        : opts.highlight?.(token.content, `markdown`, ``);
      const markup = render(
        {
          source: token.content,
          meta: info.slice(PROMPT_LANGUAGE.length).trim(),
          attributes: token.attrs ?? [],
          highlighted: highlighted ? promptHighlight(highlighted) : undefined
        },
        env[IDS] ?? promptIds()
      );
      if (markup) {
        meta.markup = markup;
        return `${markup.open}<div class="${PROMPT_PREVIEW_CLASS}">`;
      }
    }
    return renderFence
      ? renderFence(tokens, idx, opts, env, self)
      : self.renderToken(tokens, idx, opts);
  };

  md.renderer.rules.prompt_close = (tokens, idx): string => {
    const fence: Token | undefined = tokens[idx]?.meta?.fence;
    const meta: PromptMeta | null = fence?.meta ?? null;
    return meta?.markup ? `</div>${meta.markup.close}\n` : ``;
  };
};
