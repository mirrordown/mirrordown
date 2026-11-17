import type { Element, ElementContent, Root } from "hast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import {
  createTabIconResolver,
  tabIconMarkup,
  type TabIconsOptions
} from "@mirrordown/core/tab-icons";

export type { TabIcon, TabIconsOptions } from "@mirrordown/core/tab-icons";

const hasClass = (node: ElementContent | undefined, name: string): boolean => {
  if (node?.type !== `element`) return false;
  const value = node.properties.className ?? node.properties.class;
  return Array.isArray(value)
    ? value.includes(name)
    : typeof value === `string` && value.split(` `).includes(name);
};

// A group's own children with a class: its labels or panels (a group nested in a panel has its own).
const childrenWithClass = (
  parent: Element | undefined,
  name: string
): Element[] =>
  (parent?.children ?? []).filter((child): child is Element =>
    hasClass(child, name)
  );

/**
 * rehype plugin that adds an icon to each tab label of `@mirrordown/remd-tabs`: the one a `[!keyword]` marker at the start of the label names (`% [!npm] Install`), or, without a marker, the one the label's text matches (`% npm`, `% vite.config.ts`), as vitepress-plugin-group-icons matches code-group labels. The icon is an inline `<svg class="markdown-tab-icon" aria-hidden="true">` before the label's text, as a `raw` node, so it reaches the HTML exactly as the markdown-it and Sätteri plugins write it (stringify with `allowDangerousHtml`); the marker comes out of the label and the panel's `aria-label`. The matching and the icons are shared through `@mirrordown/core`.
 */
export const rehypeTabIcons: Plugin<[TabIconsOptions?], Root> = (
  options = {}
) => {
  const resolve = createTabIconResolver(options);
  const { containerClass = `markdown-tabs` } = options;
  return (tree) => {
    visit(tree, `element`, (node) => {
      if (!hasClass(node, containerClass)) return;
      const [labelsRow] = childrenWithClass(node, `${containerClass}-labels`);
      const [panelsRow] = childrenWithClass(node, `${containerClass}-panels`);
      const labels = childrenWithClass(labelsRow, `${containerClass}-label`);
      const panels = childrenWithClass(panelsRow, `${containerClass}-panel`);
      for (const [index, label] of labels.entries()) {
        const panel = panels[index];
        const key =
          panel && `aria-label` in panel.properties
            ? `aria-label`
            : `ariaLabel`;
        const plain = panel?.properties[key];
        const first =
          label.children[0]?.type === `text` ? label.children[0] : undefined;
        // A keyword that is a defined abbreviation was wrapped by the abbr plugin, which splits the marker's text in three: `[!`, the abbreviation, and the text from `]` on. Read together they are the marker's text still.
        const [, abbr, after] = label.children;
        const term =
          abbr?.type === `element` &&
          abbr.tagName === `abbr` &&
          abbr.children.length === 1 &&
          abbr.children[0]?.type === `text`
            ? abbr.children[0]
            : undefined;
        const split =
          first?.value === `[!` &&
          abbr &&
          term &&
          after?.type === `text` &&
          after.value.startsWith(`]`)
            ? { abbr, after, lead: first.value + term.value + after.value }
            : undefined;
        const {
          icon,
          marker,
          label: text
        } = resolve(
          typeof plain === `string` ? plain : ``,
          split?.lead ?? first?.value ?? ``
        );
        if (marker && split) {
          split.after.value = split.lead.slice(marker.length);
          // A label that is only a marker reads as its keyword, which stays the abbreviation it is; otherwise the abbreviation goes with the marker.
          const only = label.children.length === 3 && split.after.value === ``;
          label.children.splice(
            0,
            3,
            ...(only ? [split.abbr] : []),
            ...(split.after.value ? [split.after] : [])
          );
          if (panel) panel.properties[key] = text;
        } else if (marker && first) {
          // A label that is only a marker reads as its keyword; one with markup after the marker keeps just that.
          first.value =
            first.value.slice(marker.length) ||
            (label.children.length === 1 ? text : ``);
          if (first.value === ``) label.children.shift();
          if (panel) panel.properties[key] = text;
        }
        if (icon) {
          // hast's types have no `raw` node without mdast-util-to-hast's augmentation, so the children are widened to take one.
          const children: Array<{ type: string; value?: string }> =
            label.children;
          children.unshift({ type: `raw`, value: tabIconMarkup(icon) });
        }
      }
    });
  };
};
