// AlertType narrowing via cast — keys may be user-defined and fall through
// to capitalize. Defensive optional chains on array[i] accesses are also kept.
/* oxlint-disable typescript/no-unsafe-type-assertion */
/* oxlint-disable typescript/no-unnecessary-condition */
import type { PluginWithOptions } from "markdown-it";
import { ALERT_ALIASES, DEFAULT_TITLE } from "./types.js";
import { ICONS } from "./icons.js";
import type { AlertOptions, AlertType } from "./types.js";

export type { AlertOptions, AlertType };
export { ALERT_ALIASES, DEFAULT_TITLE, ICONS };

// Groups: 1=type keyword, 2=foldable marker (+/-), 3=custom title
const ALERT_RE = /^\[!([^\]]+)\]([+-])?\s*(.*)?$/s;

const capitalize = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1);

/** markdown-it plugin for GitHub-style alerts/admonitions (`> [!NOTE]`, `> [!WARNING]`, …). */
export const githubAlerts: PluginWithOptions<AlertOptions> = (
  md,
  options = {}
) => {
  const {
    types: extraTypes = {},
    titles: customTitles = {},
    matchCaseInsensitive = true,
    icons: showIcons = true,
    containerClass = "markdown-alert"
  } = options;

  const aliasMap: Record<string, string> = { ...ALERT_ALIASES, ...extraTypes };
  const titles: Partial<Record<AlertType, string>> = customTitles;

  const resolve = (keyword: string): string | undefined =>
    aliasMap[matchCaseInsensitive ? keyword.toLowerCase() : keyword];

  // `type` may be a user-defined alert type from `options.types` that
  // isn't in DEFAULT_TITLE; capitalize the keyword as a last resort.
  const titleFor = (type: string): string =>
    titles[type as AlertType] ??
    DEFAULT_TITLE[type as AlertType] ??
    capitalize(type);

  const iconFor = (type: string): string =>
    showIcons ? ICONS[type as AlertType] : "";

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

      const firstLine = firstChild.content.split("\n")[0];
      const match = ALERT_RE.exec(firstLine.trim());
      if (!match) continue;

      const [, keyword, foldMarker, customTitle] = match;
      const type = resolve(keyword);
      if (!type) continue;

      const isFoldable = foldMarker === "+" || foldMarker === "-";
      const title = customTitle?.trim() || titleFor(type);

      // Strip the marker line from the first inline token's children.
      // The first text child holds only the marker ("[!NOTE]") because mdit
      // splits inline children at softbreak boundaries; body lines are
      // subsequent softbreak + text sibling tokens.
      const rest = firstChild.content
        .slice(firstLine.length)
        .replace(/^\n/, "");
      if (rest) {
        // Rare: marker and body share one text node (no softbreak between them)
        firstChild.content = rest;
      } else {
        // Drop the marker node and any leading softbreak
        const hasSoftbreak = firstInline.children[1]?.type === "softbreak";
        firstInline.children.splice(0, hasSoftbreak ? 2 : 1);
        if (firstInline.children.length === 0) {
          tokens.splice(i + 1, 3);
          closeIdx -= 3;
        }
      }

      // Build title element (p normally, summary when foldable)
      const titleTag = isFoldable ? "summary" : "p";
      const titleOpen = new state.Token(`${titleTag}_open`, titleTag, 1);
      titleOpen.attrSet("class", `${containerClass}-title`);
      titleOpen.attrSet("aria-label", title);

      // SVG emitted as html_inline renders verbatim without requiring html:true
      const iconSvg = iconFor(type);
      const iconToken = new state.Token("html_inline", "", 0);
      iconToken.content = iconSvg;
      const textToken = new state.Token("text", "", 0);
      textToken.content = title;
      const titleInline = new state.Token("inline", "", 0);
      titleInline.children = [...(iconSvg ? [iconToken] : []), textToken];

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
      containerOpen.meta = { attrsRole: "container" };

      const containerClose = new state.Token(
        `${containerTag}_close`,
        containerTag,
        -1
      );
      containerClose.block = true;
      containerClose.meta = { attrsRole: "container" };

      tokens.splice(i, 1, containerOpen, titleOpen, titleInline, titleClose);
      closeIdx += 3; // 3 tokens inserted before closeIdx
      tokens.splice(closeIdx, 1, containerClose);
    }
  });
};
