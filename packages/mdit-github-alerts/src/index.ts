import type { PluginWithOptions } from "markdown-it";
import { ALERT_ALIASES, DEFAULT_TITLE } from "./types.js";
import { ICONS } from "./icons.js";
import type { AlertOptions, AlertType } from "./types.js";

export type { AlertOptions, AlertType };
export { ALERT_ALIASES, DEFAULT_TITLE, ICONS };

// Matches: [!TYPE] or [!TYPE]+ or [!TYPE]- optionally followed by a title.
// Groups: 1=type keyword, 2=foldable marker (+/-), 3=custom title (trimmed)
const ALERT_RE = /^\[!([^\]]+)\]([+-])?\s*(.*)?$/s;

export const githubAlerts: PluginWithOptions<AlertOptions> = (md, options = {}) => {
  const {
    types: extraTypes = {},
    titles: customTitles = {},
    matchCaseInsensitive = true,
    icons: showIcons = true,
    containerClass = "markdown-alert",
  } = options;

  const aliasMap: Record<string, string> = { ...ALERT_ALIASES, ...extraTypes };

  const resolve = (keyword: string): string | undefined => {
    const key = matchCaseInsensitive ? keyword.toLowerCase() : keyword;
    return aliasMap[key];
  };

  const titleFor = (type: string): string =>
    (customTitles as Record<string, string>)[type] ??
    DEFAULT_TITLE[type as AlertType] ??
    type.charAt(0).toUpperCase() + type.slice(1);

  const iconFor = (type: string): string => (showIcons ? (ICONS[type as AlertType] ?? "") : "");

  md.core.ruler.after("inline", "github_alerts", (state) => {
    const tokens = state.tokens;

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i]!.type !== "blockquote_open") continue;

      // Find the matching blockquote_close
      let closeIdx = i + 1;
      let depth = 1;
      while (closeIdx < tokens.length && depth > 0) {
        if (tokens[closeIdx]!.type === "blockquote_open") depth++;
        else if (tokens[closeIdx]!.type === "blockquote_close") depth--;
        closeIdx++;
      }
      closeIdx--; // points at blockquote_close

      // The first inline token inside the blockquote holds the first line
      const firstInline = tokens[i + 2];
      if (!firstInline || firstInline.type !== "inline" || !firstInline.children) continue;

      // Check first child text token for the [!TYPE] marker
      const firstChild = firstInline.children[0];
      if (!firstChild || firstChild.type !== "text") continue;

      // Split on first newline — marker must be on the first line only
      const firstLine = firstChild.content.split("\n")[0]!;
      const match = ALERT_RE.exec(firstLine.trim());
      if (!match) continue;

      const [, keyword, foldMarker, customTitle] = match;
      const type = resolve(keyword!);
      if (!type) continue;

      const isFoldable = foldMarker === "+" || foldMarker === "-";
      const defaultOpen = foldMarker === "+";
      const title = customTitle?.trim() || titleFor(type);

      // Strip the marker line from the first inline token's children.
      // The first text child contains only the marker (e.g. "[!NOTE]") because
      // mdit splits inline children at softbreak boundaries. Any continuation
      // lines live in subsequent sibling children (softbreak + text tokens).
      const restInFirstChild = firstChild.content.slice(firstLine.length).replace(/^\n/, "");
      if (restInFirstChild) {
        // Rare case: marker and more text on the same text node (no softbreak)
        firstChild.content = restInFirstChild;
      } else {
        // Remove the marker text node; also drop a leading softbreak if present
        let removeCount = 1;
        if (firstInline.children.length > 1 && firstInline.children[1]!.type === "softbreak") {
          removeCount = 2;
        }
        firstInline.children.splice(0, removeCount);

        if (firstInline.children.length === 0) {
          // Nothing left in the paragraph — remove it entirely
          tokens.splice(i + 1, 3);
          closeIdx -= 3;
        }
      }

      // Build title token (p or summary depending on foldable mode)
      const titleTag = isFoldable ? "summary" : "p";
      const titleOpen = new state.Token(`${titleTag}_open`, titleTag, 1);
      titleOpen.attrSet("class", `${containerClass}-title`);
      titleOpen.attrSet("aria-label", title);

      // Emit SVG as html_inline so it renders verbatim without requiring
      // the consumer to opt in to html: true on the mdit instance.
      const iconSvg = iconFor(type);
      const titleInline = new state.Token("inline", "", 0);
      titleInline.children = [];
      if (iconSvg) {
        const iconToken = new state.Token("html_inline", "", 0);
        iconToken.content = iconSvg;
        titleInline.children.push(iconToken);
      }
      const textToken = new state.Token("text", "", 0);
      textToken.content = title;
      titleInline.children.push(textToken);

      const titleClose = new state.Token(`${titleTag}_close`, titleTag, -1);

      // Replace blockquote_open/close with div or details
      const containerTag = isFoldable ? "details" : "div";

      const containerOpen = new state.Token(`${containerTag}_open`, containerTag, 1);
      containerOpen.attrSet("class", containerClass);
      containerOpen.attrSet("data-alert", type);
      if (isFoldable && defaultOpen) containerOpen.attrSet("open", "");
      // Map blockquote source position
      containerOpen.map = tokens[i]!.map;
      containerOpen.block = true;

      const containerClose = new state.Token(`${containerTag}_close`, containerTag, -1);
      containerClose.block = true;

      // Splice: replace blockquote_open with container_open + title tokens
      tokens.splice(i, 1, containerOpen, titleOpen, titleInline, titleClose);
      // closeIdx shifted by +3 (we inserted 3 extra tokens before it)
      closeIdx += 3;
      // Replace blockquote_close with container_close
      tokens.splice(closeIdx, 1, containerClose);
    }
  });
};
