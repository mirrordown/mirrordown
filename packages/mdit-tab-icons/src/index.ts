import type { PluginWithOptions } from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import {
  createTabIconResolver,
  tabIconMarkup,
  type TabIconsOptions
} from "@mirrordown/core/tab-icons";

export type { TabIcon, TabIconsOptions } from "@mirrordown/core/tab-icons";

/**
 * markdown-it plugin that adds an icon to each tab label of `@mirrordown/mdit-tabs`: the one a `[!keyword]` marker at the start of the label names (`% [!npm] Install`), or, without a marker, the one the label's text matches (`% npm`, `% vite.config.ts`), as vitepress-plugin-group-icons matches code-group labels. The icon is an inline `<svg class="markdown-tab-icon" aria-hidden="true">` before the label's text; the marker comes out of the label and the panel's `aria-label`. Install it after the tabs plugin. The matching and the icons are shared with the rehype and Sätteri plugins through `@mirrordown/core`.
 */
export const tabIcons: PluginWithOptions<TabIconsOptions> = (
  md,
  options = {}
) => {
  const resolve = createTabIconResolver(options);
  const { containerClass = `markdown-tabs` } = options;

  md.core.ruler.push(`tab_icons`, (state) => {
    const { tokens } = state;
    for (const [index, token] of tokens.entries()) {
      if (token.type !== `tabs_open`) continue;
      // Only the groups with the tabs plugin's class, as the rehype and Sätteri plugins find them.
      const classes = token.attrGet(`class`)?.split(` `) ?? [];
      if (!classes.includes(containerClass)) continue;
      // This group's own labels and panels, in order; a group nested in a panel has its own.
      const labels: Token[] = [];
      const panels: Token[] = [];
      let depth = 0;
      for (let i = index + 1; i < tokens.length; i++) {
        const t = tokens[i]!;
        if (t.type === `tabs_open`) depth++;
        else if (t.type === `tabs_close`) {
          if (depth === 0) break;
          depth--;
        } else if (depth === 0 && t.type === `tab_label_open`) {
          const inline = tokens[i + 1];
          if (inline?.type === `inline`) labels.push(inline);
        } else if (depth === 0 && t.type === `tab_panel_open`) panels.push(t);
      }

      for (const [i, inline] of labels.entries()) {
        const panel = panels[i];
        const text = panel?.attrGet(`aria-label`) ?? inline.content;
        // Without the empty text token markdown-it leaves before markup that starts a label, so the first child is the one the other engines see.
        const children = (inline.children ?? []).filter(
          (child) => child.type !== `text` || child.content !== ``
        );
        const first = children[0]?.type === `text` ? children[0] : undefined;
        // A keyword that is a defined abbreviation was wrapped by the abbr plugin, which splits the marker's text in three: `[!`, the abbreviation, and the text from `]` on. Read together they are the marker's text still.
        const [, open, key, close, after] = children;
        const split =
          first?.content === `[!` &&
          open?.type === `abbr_open` &&
          key?.type === `text` &&
          close?.type === `abbr_close` &&
          after?.type === `text` &&
          after.content.startsWith(`]`)
            ? { after, lead: first.content + key.content + after.content }
            : undefined;
        const { icon, marker, label } = resolve(
          text,
          split?.lead ?? first?.content ?? ``
        );
        if (marker && split) {
          split.after.content = split.lead.slice(marker.length);
          // A label that is only a marker reads as its keyword, which stays the abbreviation it is; otherwise the abbreviation goes with the marker.
          const only = children.length === 5 && split.after.content === ``;
          children.splice(0, only ? 1 : 4);
          panel?.attrSet(`aria-label`, label);
        } else if (marker && first) {
          first.content = first.content.slice(marker.length);
          // A label that is only a marker reads as its keyword; one with markup after the marker keeps just that.
          if (children.length === 1) first.content ||= label;
          panel?.attrSet(`aria-label`, label);
        }
        if (icon) {
          const html = new state.Token(`html_inline`, ``, 0);
          html.content = tabIconMarkup(icon);
          children.unshift(html);
        }
        inline.children = children.filter(
          (child) => child.type !== `text` || child.content !== ``
        );
      }
    }
  });
};
