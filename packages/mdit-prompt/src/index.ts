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

// A preview's link reference definitions, by each of its inline tokens: they are the prompt's own, as in remark and Sätteri, where a preview is a document of its own.
type References = Record<string, unknown> | undefined;
const REFERENCES = new WeakMap<Token, References>();
// The type a preview's inline token carries while markdown-it's `inline` rule runs.
const HELD = `prompt_inline`;

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
      // The environment is the page's, so ids stay unique across the page and its previews, but for the link reference definitions: the preview collects its own, and the page's are put back.
      const page: References = state.env.references;
      state.env.references = {};
      md.block.parse(token.content, md, state.env, preview);
      const own: References = state.env.references;
      state.env.references = page;
      // Its lines and nesting are the page's: the prompt's text starts the line after its fence.
      const line = (token.map?.[0] ?? 0) + 1;
      for (const child of preview) {
        if (child.type === `inline`) REFERENCES.set(child, own);
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

  // markdown-it's `inline` rule resolves every link against one set of definitions. A preview's text is read against the preview's instead, so a prompt can't link through a definition on the page, nor the page through a prompt's. Two rules around markdown-it's own do it, leaving that rule as it is (and as any other plugin left it): the first keeps a preview's inline tokens out of its way, the second parses them and gives them their type back before the rules that follow look for inline tokens.
  md.core.ruler.before(`inline`, `prompt_inline_hold`, (state) => {
    for (const token of state.tokens) {
      if (REFERENCES.has(token)) token.type = HELD;
    }
  });
  md.core.ruler.after(`inline`, `prompt_inline`, (state) => {
    for (const token of state.tokens) {
      if (token.type !== HELD) continue;
      token.type = `inline`;
      const page: References = state.env.references;
      state.env.references = REFERENCES.get(token);
      md.inline.parse(token.content, md, state.env, (token.children ??= []));
      state.env.references = page;
    }
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
