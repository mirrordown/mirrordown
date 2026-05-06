import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root, Blockquote, Paragraph, Text } from "mdast";
import type { Element, ElementContent, Properties } from "hast";
import type { State } from "mdast-util-to-hast";
import { ALERT_ALIASES, DEFAULT_TITLE } from "./types.js";
import { ICONS } from "./icons.js";
import type { AlertOptions, AlertType } from "./types.js";

export type { AlertOptions, AlertType };
export { ALERT_ALIASES, DEFAULT_TITLE, ICONS };

// Groups: 1=type keyword, 2=foldable marker (+/-), 3=custom title
const ALERT_RE = /^\[!([^\]]+)\]([+-])?\s*(.*)?$/s;

interface AlertNode extends Blockquote {
  data: {
    hName: string;
    hProperties: Properties;
    alertType: string;
    alertTitle: string;
    alertFoldable: boolean;
    alertDefaultOpen: boolean;
    alertIcon: string;
  };
}

export const remarkGithubAlerts: Plugin<[AlertOptions?], Root> = (options = {}) => {
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

  return (tree) => {
    visit(tree, "blockquote", (node: Blockquote) => {
      const firstChild = node.children[0];
      if (!firstChild || firstChild.type !== "paragraph") return;

      const firstPara = firstChild as Paragraph;
      const firstText = firstPara.children[0];
      if (!firstText || firstText.type !== "text") return;

      const textNode = firstText as Text;
      const firstLine = textNode.value.split("\n")[0]!;
      const match = ALERT_RE.exec(firstLine.trim());
      if (!match) return;

      const [, keyword, foldMarker, customTitle] = match;
      const type = resolve(keyword!);
      if (!type) return;

      const isFoldable = foldMarker === "+" || foldMarker === "-";
      const defaultOpen = foldMarker === "+";
      const title = customTitle?.trim() || titleFor(type);

      // Strip the marker line from the first paragraph.
      // If there was text after the marker on subsequent lines, keep it.
      const rest = textNode.value.slice(firstLine.length).replace(/^\n/, "");
      if (rest) {
        textNode.value = rest;
      } else {
        // Remove the entire first paragraph if the marker line was all it had
        node.children.splice(0, 1);
      }

      // Annotate the blockquote node so the hast handler can render it
      const alertNode = node as AlertNode;
      alertNode.data = {
        hName: isFoldable ? "details" : "div",
        hProperties: {
          class: containerClass,
          "data-alert": type,
          ...(isFoldable && defaultOpen ? { open: true } : {}),
        },
        alertType: type,
        alertTitle: title,
        alertFoldable: isFoldable,
        alertDefaultOpen: defaultOpen,
        alertIcon: iconFor(type),
      };
    });
  };
};

const svgToHast = (svgString: string): Element | null => {
  if (!svgString) return null;
  // The SVG strings from icons.ts are known-safe, self-contained elements.
  // Rather than parsing, we embed them as a raw hast element using the
  // pre-parsed structure. We pass through as a raw node via hast's html type
  // so rehype-stringify emits it verbatim.
  return {
    type: "element",
    tagName: "span",
    properties: { "aria-hidden": true },
    children: [{ type: "raw", value: svgString } as unknown as ElementContent],
  };
};

const buildTitleElement = (
  tag: "p" | "summary",
  alertTitle: string,
  alertIcon: string,
  containerClass: string,
): Element => {
  const children: ElementContent[] = [];
  const icon = svgToHast(alertIcon);
  if (icon) children.push(icon);
  children.push({ type: "text", value: alertTitle });

  return {
    type: "element",
    tagName: tag,
    properties: { class: `${containerClass}-title`, "aria-label": alertTitle },
    children,
  };
};

export const githubAlertsHastHandlers = {
  blockquote(state: State, node: Blockquote): ElementContent {
    const alertNode = node as AlertNode;
    const data = alertNode.data;

    // Non-alert blockquotes fall through to the default handler
    if (!data?.alertType) {
      const result: Element = {
        type: "element",
        tagName: "blockquote",
        properties: {},
        children: state.all(node),
      };
      state.patch(node, result);
      return result;
    }

    const containerClass = (data.hProperties?.class as string) ?? "markdown-alert";
    const titleTag = data.alertFoldable ? "summary" : "p";
    const titleEl = buildTitleElement(titleTag, data.alertTitle, data.alertIcon, containerClass);

    const bodyChildren = state.all(node);
    const children: ElementContent[] = [
      { type: "text", value: "\n" },
      titleEl,
      ...bodyChildren.flatMap((child) => [{ type: "text", value: "\n" } as ElementContent, child]),
      { type: "text", value: "\n" },
    ];

    const result: Element = {
      type: "element",
      tagName: data.hName,
      properties: data.hProperties,
      children,
    };
    state.patch(node, result);
    return result;
  },
} as const;
