import {
  createTabIconResolver,
  tabIconMarkup,
  type TabIconsOptions
} from "@mirrordown/core/tab-icons";
import {
  defineHastPlugin,
  type HastVisitorInstance,
  type PluginFactoryContext
} from "satteri";

export type { TabIcon, TabIconsOptions } from "@mirrordown/core/tab-icons";

type AfterHook = NonNullable<HastVisitorInstance["after"]>;
type HastNode = Parameters<AfterHook>[0]["children"][number];
type Element = Extract<HastNode, { type: "element" }>;

/**
 * The plugin's definition: only the keys it defines, with a synchronous hook, so `markdownToHtml` returns its result directly.
 */
export interface TabIconsPlugin {
  name: string;
  after: (...args: Parameters<AfterHook>) => void;
}

const hasClass = (node: HastNode | undefined, name: string): boolean => {
  if (node?.type !== `element`) return false;
  const value = node.properties.className;
  return Array.isArray(value) && value.includes(name);
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
 * Sätteri plugin that adds an icon to each tab label of `@mirrordown/sat-tabs`: the one a `[!keyword]` marker at the start of the label names (`% [!npm] Install`), or, without a marker, the one the label's text matches (`% npm`, `% vite.config.ts`), as vitepress-plugin-group-icons matches code-group labels. The icon is an inline `<svg class="markdown-tab-icon" aria-hidden="true">` before the label's text, as a `raw` node, so it reaches the HTML exactly as the markdown-it and rehype plugins write it; the marker comes out of the label and the panel's `aria-label`. The matching and the icons are shared through `@mirrordown/core`.
 */
export const satteriTabIcons = (
  options: TabIconsOptions = {}
): ((ctx: PluginFactoryContext) => TabIconsPlugin) => {
  const resolve = createTabIconResolver(options);
  const { containerClass = `markdown-tabs` } = options;
  return () =>
    defineHastPlugin({
      name: `tab-icons`,
      after(root, ctx) {
        const walk = (children: readonly HastNode[]): void => {
          for (const node of children) {
            if (node.type !== `element`) continue;
            if (hasClass(node, containerClass)) decorate(node);
            walk(node.children);
          }
        };
        const decorate = (group: Element): void => {
          const [labelsRow] = childrenWithClass(
            group,
            `${containerClass}-labels`
          );
          const [panelsRow] = childrenWithClass(
            group,
            `${containerClass}-panels`
          );
          const labels = childrenWithClass(
            labelsRow,
            `${containerClass}-label`
          );
          const panels = childrenWithClass(
            panelsRow,
            `${containerClass}-panel`
          );
          for (const [index, label] of labels.entries()) {
            const panel = panels[index];
            const plain = panel?.properties.ariaLabel;
            const {
              icon,
              marker,
              label: text
            } = resolve(typeof plain === `string` ? plain : ``);
            if (marker) {
              const first = label.children[0];
              if (first?.type === `text`) {
                const rest = first.value.slice(marker.length) || text;
                if (rest === ``) ctx.removeNode(first);
                else ctx.replaceNode(first, { type: `text`, value: rest });
              }
              if (panel) ctx.setProperty(panel, `ariaLabel`, text);
            }
            if (icon)
              ctx.prependChild(label, {
                type: `raw`,
                value: tabIconMarkup(icon)
              });
          }
        };
        walk(root.children);
      }
    });
};
