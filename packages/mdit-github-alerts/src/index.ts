// Defensive optional chains on array[i] accesses are kept.
/* oxlint-disable typescript/no-unnecessary-condition */
import type { PluginWithOptions } from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import {
  ALERT_ALIASES,
  DEFAULT_TITLE,
  ICONS,
  createAlertResolver,
  type AlertOptions,
  type AlertType
} from "@mirrordown/core";

export type { AlertOptions, AlertType };
export { ALERT_ALIASES, DEFAULT_TITLE, ICONS };

// Groups: 1=type keyword, 2=foldable marker (+/-)
const MARKER_RE = /^\[!([^\]]+)\]([+-])?/;

const isLineBreak = (type: string): boolean =>
  type === "softbreak" || type === "hardbreak";

// Plain text of inline tokens, for the title's aria-label: text, inline code
// and image alt count; raw HTML does not. (markdown-it's renderInlineAsText
// skips inline code.)
const plainText = (tokens: Token[]): string =>
  tokens
    .map((t) =>
      t.type === "text" || t.type === "code_inline"
        ? t.content
        : t.type === "image" && t.children
          ? plainText(t.children)
          : ""
    )
    .join("");

/** markdown-it plugin for GitHub-style alerts/admonitions (`> [!NOTE]`, `> [!WARNING]`, …). */
export const githubAlerts: PluginWithOptions<AlertOptions> = (
  md,
  options = {}
) => {
  // Keyword, title and icon resolution is shared with every engine.
  const { resolve, titleFor, iconFor, containerClass } =
    createAlertResolver(options);

  // markdown-it renders every attribute as `name="value"`; emit the boolean
  // `open` bare, as hast does, so both engines produce the same HTML.
  const renderDetailsOpen = md.renderer.rules["details_open"];
  md.renderer.rules["details_open"] = (
    tokens,
    idx,
    opts,
    env,
    self
  ): string => {
    const html = renderDetailsOpen
      ? renderDetailsOpen(tokens, idx, opts, env, self)
      : self.renderToken(tokens, idx, opts);
    return tokens[idx].meta?.githubAlert
      ? html.replace(' open=""', " open")
      : html;
  };

  md.core.ruler.after("inline", "github_alerts", (state) => {
    const { tokens } = state;

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== "blockquote_open") continue;

      // Find the matching blockquote_close
      let closeIdx = i + 1;
      for (let depth = 1; depth > 0; closeIdx++) {
        const t = tokens[closeIdx].type;
        if (t === "blockquote_open") depth++;
        else if (t === "blockquote_close") depth--;
      }
      closeIdx--; // points at blockquote_close

      // The first inline token inside the blockquote holds the first line
      const firstInline = tokens[i + 2];
      if (firstInline?.type !== "inline" || !firstInline.children) continue;

      // Check first child text token for the [!TYPE] marker
      const firstChild = firstInline.children[0];
      if (firstChild?.type !== "text") continue;

      const match = MARKER_RE.exec(firstChild.content.trimStart());
      if (!match) continue;

      const [marker, keyword, foldMarker] = match;
      const type = resolve(keyword);
      if (!type) continue;

      const isFoldable = foldMarker === "+" || foldMarker === "-";

      // The first line is the marker plus an optional title (inline content,
      // formatting included); everything after the first line break, soft or
      // hard, is the body.
      const children = firstInline.children;
      let lineEnd = children.findIndex((t) => isLineBreak(t.type));
      if (lineEnd === -1) lineEnd = children.length;
      const afterMarker = firstChild.content.trimStart().slice(marker.length);
      firstChild.content = afterMarker.trimStart();
      const titleTokens = children
        .slice(0, lineEnd)
        .filter((t) => t.type !== "text" || t.content !== "");
      const lastTitle = titleTokens.at(-1);
      if (lastTitle?.type === "text")
        lastTitle.content = lastTitle.content.trimEnd();
      const titleText = plainText(titleTokens).trim();

      const body = children.slice(lineEnd + 1);
      if (body.length > 0) {
        firstInline.children = body;
      } else {
        tokens.splice(i + 1, 3);
        closeIdx -= 3;
      }

      const title = titleText || titleFor(type);

      // Build title element (p normally, summary when foldable)
      const titleTag = isFoldable ? "summary" : "p";
      const titleOpen = new state.Token(`${titleTag}_open`, titleTag, 1);
      titleOpen.attrSet("class", `${containerClass}-title`);
      titleOpen.attrSet("aria-label", title);

      // SVG emitted as html_inline renders verbatim without requiring html:true
      const iconSvg = iconFor(type);
      const iconToken = new state.Token("html_inline", "", 0);
      iconToken.content = iconSvg;
      const defaultTitle = new state.Token("text", "", 0);
      defaultTitle.content = title;
      const titleInline = new state.Token("inline", "", 0);
      titleInline.children = [
        ...(iconSvg ? [iconToken] : []),
        ...(titleText ? titleTokens : [defaultTitle])
      ];

      const titleClose = new state.Token(`${titleTag}_close`, titleTag, -1);

      // Replace blockquote_open/close with div (or details when foldable)
      const containerTag = isFoldable ? "details" : "div";
      const containerOpen = new state.Token(
        `${containerTag}_open`,
        containerTag,
        1
      );
      containerOpen.attrSet("class", containerClass);
      containerOpen.attrSet("data-alert", type);
      if (foldMarker === "+") containerOpen.attrSet("open", "");
      containerOpen.map = tokens[i].map;
      containerOpen.block = true;
      containerOpen.meta = { attrsRole: "container", githubAlert: true };

      const containerClose = new state.Token(
        `${containerTag}_close`,
        containerTag,
        -1
      );
      containerClose.block = true;
      containerClose.meta = { attrsRole: "container" };

      // Nest the new tokens at the blockquote's level, as markdown-it's own would be, so plugins that walk tokens by level read the alert's structure.
      const level = tokens[i].level;
      containerOpen.level = containerClose.level = level;
      titleOpen.level = titleClose.level = level + 1;
      titleInline.level = level + 2;

      tokens.splice(i, 1, containerOpen, titleOpen, titleInline, titleClose);
      closeIdx += 3; // 3 tokens inserted before closeIdx
      tokens.splice(closeIdx, 1, containerClose);
    }
  });
};
