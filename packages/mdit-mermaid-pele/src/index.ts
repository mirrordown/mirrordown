// Token.meta is typed `any` by markdown-it; the casts below read/write our own
// mermaidPele entry on it.
/* oxlint-disable typescript/no-unsafe-type-assertion */
import type { PluginWithOptions } from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import { render, type RenderOptions } from "pele";
import {
  mermaidFailure,
  mermaidIdPrefixes,
  mermaidSource,
  mermaidSvg
} from "@mirrordown/core";

/** Options for {@link mermaidPele}: Pele's render options, besides the id prefix, which is set per diagram. */
export interface MermaidPeleOptions extends Omit<RenderOptions, "idPrefix"> {
  /**
   * The start of each diagram's id prefix, followed by a hash of the diagram, so several diagrams on a page don't share ids.
   *
   * @default "mermaid"
   */
  prefix?: string | undefined;
  /**
   * Called when a diagram fails to render, with the fence's token, the diagram, the error and the render's `env`. The HTML it returns replaces the diagram; if it returns nothing, the fence is removed. Without it, a diagram that fails to render throws.
   */
  errorFallback?:
    | ((
        token: Token,
        diagram: string,
        error: unknown,
        env: unknown
      ) => string | null | undefined)
    | undefined;
}

interface MermaidMeta {
  mermaidPele?: string;
}

/**
 * markdown-it plugin that renders ` ```mermaid ` fences to inline SVG with Pele, in place of the code block. Attributes on the fence (`{#id .class}`, with markdown-it-attrs) go on the `<svg>`. Theme the diagrams with Pele's CSS variables (`--pele-bg`, `--pele-fg`, …); the stylesheet at `./styles` adds a dark scheme. The id prefixes, attributes and errors are shared with the rehype and Sätteri plugins through `@mirrordown/core`.
 */
export const mermaidPele: PluginWithOptions<MermaidPeleOptions> = (
  md,
  options = {}
) => {
  const { prefix = `mermaid`, errorFallback, ...pele } = options;

  // Diagrams render in document order, so each one's id prefix counts the repeats before it.
  md.core.ruler.push(`mermaid_pele`, (state) => {
    const idPrefix = mermaidIdPrefixes(prefix);
    for (const token of state.tokens) {
      if (token.type !== `fence`) continue;
      const lang = md.utils.unescapeAll(token.info).trim().split(/\s+/)[0];
      if (lang !== `mermaid`) continue;
      const source = mermaidSource(token.content);
      let html: string;
      try {
        html = mermaidSvg(
          render(source, { ...pele, idPrefix: idPrefix(source) }).svg,
          token.attrs ?? []
        );
      } catch (error) {
        if (!errorFallback)
          throw mermaidFailure(error, token.map ? token.map[0] + 1 : undefined);
        html = errorFallback(token, source, error, state.env) ?? ``;
      }
      token.meta = { ...token.meta, mermaidPele: html } satisfies MermaidMeta;
    }
  });

  const renderFence = md.renderer.rules.fence;
  md.renderer.rules.fence = (tokens, idx, opts, env, self): string => {
    const token = tokens[idx];
    const html = (token?.meta as MermaidMeta | null)?.mermaidPele;
    if (html !== undefined) return html;
    return renderFence
      ? renderFence(tokens, idx, opts, env, self)
      : self.renderToken(tokens, idx, opts);
  };
};
