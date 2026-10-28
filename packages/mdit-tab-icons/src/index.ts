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

  md.core.ruler.push(`tab_icons`, (state) => {
    const { tokens } = state;
    for (const [index, token] of tokens.entries()) {
      if (token.type !== `tabs_open`) continue;
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
        const { icon, marker, label } = resolve(text);
        const children = inline.children ?? [];
        if (marker) {
          const first = children[0];
          if (first?.type === `text`) {
            first.content = first.content.slice(marker.length);
            if (first.content === `` && label) first.content = label;
          }
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
