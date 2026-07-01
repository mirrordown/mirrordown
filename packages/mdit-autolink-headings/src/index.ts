import type { PluginWithOptions } from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";

export interface AutolinkHeadingsOptions {
  /** Where to place the link relative to the heading (default: `"prepend"`). */
  behavior?: "prepend" | "append" | "wrap" | "before" | "after";
  /** Class name for the link element (default: `"anchor"`). */
  class?: string;
}

// A heading is rendered as `heading_open`, `inline`, `heading_close`. Only the
// `heading_open` carries the `id` attr, so at close time we scan back to the
// nearest `heading_open` (headings never nest) to recover it.
const headingId = (tokens: Token[], idx: number): string | null => {
  for (let i = idx - 1; i >= 0; i -= 1) {
    if (tokens[i]?.type === "heading_open") {
      return tokens[i]?.attrGet("id") ?? null;
    }
  }
  return null;
};

/**
 * markdown-it plugin that adds a self-referential link to every heading that
 * has an `id` (pair it after `@mirrordown/mdit-slug` or markdown-it-attrs).
 *
 * By default the link is prepended, empty, and carries `class="anchor"` — the
 * shipped stylesheet (`@mirrordown/mdit-autolink-headings/styles`) draws a `#`
 * marker on hover via `::before`. Mirrors `@mirrordown/remd-autolink-headings`.
 */
export const autolinkHeadings: PluginWithOptions<AutolinkHeadingsOptions> = (
  md,
  options
) => {
  const behavior = options?.behavior ?? "prepend";
  const cls = options?.class ?? "anchor";
  const inject = behavior === "prepend" || behavior === "append";

  type RenderRule = NonNullable<typeof md.renderer.rules.heading_open>;
  const renderToken: RenderRule = (tokens, idx, opts, _env, self) =>
    self.renderToken(tokens, idx, opts);
  const defaultOpen = md.renderer.rules.heading_open ?? renderToken;
  const defaultClose = md.renderer.rules.heading_close ?? renderToken;

  // The inject behaviors set aria-hidden + tabindex, since the link sits beside
  // the visible heading text rather than wrapping it.
  const linkAttrs = (id: string): string =>
    inject
      ? `class="${cls}" aria-hidden="true" tabindex="-1" href="#${id}"`
      : `class="${cls}" href="#${id}"`;
  const emptyLink = (id: string): string => `<a ${linkAttrs(id)}></a>`;

  md.renderer.rules.heading_open = (tokens, idx, opts, env, self): string => {
    const open = defaultOpen(tokens, idx, opts, env, self);
    const id = tokens[idx]?.attrGet("id");
    if (id === null || id === undefined) return open;
    if (behavior === "prepend") return open + emptyLink(id);
    if (behavior === "wrap") return `${open}<a ${linkAttrs(id)}>`;
    if (behavior === "before") return emptyLink(id) + open;
    return open; // append / after are emitted at heading_close
  };

  md.renderer.rules.heading_close = (tokens, idx, opts, env, self): string => {
    const close = defaultClose(tokens, idx, opts, env, self);
    const id = headingId(tokens, idx);
    if (id === null) return close;
    if (behavior === "append") return emptyLink(id) + close;
    if (behavior === "wrap") return `</a>${close}`;
    if (behavior === "after") return close + emptyLink(id);
    return close; // prepend / before are emitted at heading_open
  };
};
