// The AlertNode subtype bridging the remark visitor and the rehype hast handler
// requires casts the public mdast types cannot carry through. Defensive
// optional chains on array[i] accesses are kept (an empty blockquote has none).
/* oxlint-disable typescript/no-unsafe-type-assertion */
/* oxlint-disable typescript/no-unnecessary-condition */
import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root, Blockquote, BlockContent } from "mdast";
import type { Element, ElementContent, Properties } from "hast";
import type { State, Handler } from "mdast-util-to-hast";
import {
  ALERT_ALIASES,
  DEFAULT_TITLE,
  ICONS,
  createAlertResolver,
  splitAlertParagraph,
  type AlertOptions,
  type AlertType
} from "@mirrordown/core";

export type { AlertOptions, AlertType };
export { ALERT_ALIASES, DEFAULT_TITLE, ICONS };

interface AlertData {
  hName: string;
  hProperties: Properties;
  alertType: string;
  alertIcon: string;
  attrsRole: string;
}

type AlertNode = Blockquote & { data: AlertData };

/** remark plugin for GitHub-style alerts/admonitions (`> [!NOTE]`, `> [!WARNING]`, …). */
export const remarkGithubAlerts: Plugin<[AlertOptions?], Root> = (
  options = {}
) => {
  const { resolve, titleFor, iconFor, containerClass } =
    createAlertResolver(options);

  return (tree, file) => {
    // The source tells an escaped marker (`\[!NOTE]`) from a real one.
    const source = String(file);
    visit(tree, "blockquote", (node: Blockquote) => {
      const firstChild = node.children[0];
      if (firstChild?.type !== "paragraph") return;

      // The marker line rule (title, formatting included; body after the
      // first line break) is shared with every engine in @mirrordown/core.
      const alert = splitAlertParagraph(firstChild.children, source);
      if (!alert) return;
      const type = resolve(alert.keyword);
      if (!type) return;

      if (alert.bodyNodes.length > 0) {
        firstChild.children = alert.bodyNodes;
      } else {
        node.children.splice(0, 1);
      }

      // The title is the alert's first child and renders through `hName`/`hProperties`, so it is there without `githubAlertsHastHandlers` too (which only add the icon), and its class is its own whatever the container's becomes.
      const title = alert.titleText || titleFor(type);
      const titleNode = {
        type: "alertTitle",
        data: {
          hName: alert.fold ? "summary" : "p",
          hProperties: {
            class: `${containerClass}-title`,
            "aria-label": title
          }
        },
        // A title without plain text (an image with no alt) is still the title; the default one then only labels it.
        children:
          alert.titleNodes.length > 0
            ? alert.titleNodes
            : [{ type: "text", value: title }]
      };
      node.children.unshift(titleNode as unknown as BlockContent);

      // A plugin that ran earlier may have left data on the blockquote (attributes): the alert adds to it.
      const { class: classes, ...attributes } = node.data?.hProperties ?? {};
      (node as AlertNode).data = {
        ...node.data,
        hName: alert.fold ? "details" : "div",
        hProperties: {
          class:
            typeof classes === "string"
              ? `${containerClass} ${classes}`
              : containerClass,
          "data-alert": type,
          ...(alert.fold === "+" ? { open: true } : {}),
          ...attributes
        },
        alertType: type,
        alertIcon: iconFor(type),
        attrsRole: "container"
      };
    });
  };
};

// The icons in icons.ts are fixed Lucide SVGs: elements with quoted attributes and explicit closing tags, no text. They become hast elements rather than a `raw` node, which rehype-stringify escapes unless `allowDangerousHtml` is on.
const SVG_TAG = /<(\/?)([a-zA-Z]+)((?:\s+[^\s=/>]+="[^"]*")*)\s*>/g;
const SVG_ATTRIBUTE = /([^\s=]+)="([^"]*)"/g;
const svgToHast = (svgString: string): Element | undefined => {
  const roots: Element[] = [];
  const open: Element[] = [];
  for (const [, closing, tagName = ``, attributes = ``] of svgString.matchAll(
    SVG_TAG
  )) {
    if (closing) {
      open.pop();
      continue;
    }
    const element: Element = {
      type: `element`,
      tagName,
      properties: Object.fromEntries(
        Array.from(attributes.matchAll(SVG_ATTRIBUTE), ([, name, value]) => [
          name,
          value
        ])
      ),
      children: []
    };
    (open.at(-1)?.children ?? roots).push(element);
    open.push(element);
  }
  return roots[0];
};

const nl: ElementContent = { type: "text", value: "\n" };

/** mdast-to-hast handler that renders alert blockquotes, for use with `remark-rehype`. */
export const githubAlertsHastHandlers: Record<string, Handler> = {
  blockquote(state: State, node: Blockquote): ElementContent {
    const data = (node as Partial<AlertNode>).data;

    // Non-alert blockquotes fall through to the default handler
    if (!data?.alertType) {
      const result: Element = {
        type: "element",
        tagName: "blockquote",
        properties: {},
        children: state.all(node)
      };
      state.patch(node, result);
      // As the default handler does, so other plugins' `data` (attrs) still apply.
      return state.applyData(node, result);
    }

    // The title is the first child and renders by its own `data`; the icon goes in front of its content.
    const children = state.all(node);
    const [title] = children;
    const icon = svgToHast(data.alertIcon);
    if (icon && title?.type === "element") title.children.unshift(icon);

    const result: Element = {
      type: "element",
      tagName: data.hName,
      properties: data.hProperties,
      children: [...children.flatMap((child) => [nl, child]), nl]
    };
    state.patch(node, result);
    return result;
  }
};
