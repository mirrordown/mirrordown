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
        const {
          icon,
          marker,
          label: text
        } = resolve(typeof plain === `string` ? plain : ``);
        if (marker) {
          const first = label.children[0];
          if (first?.type === `text`) {
            first.value = first.value.slice(marker.length) || text;
            if (first.value === ``) label.children.shift();
          }
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
