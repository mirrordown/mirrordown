// AlertType cast and the AlertNode subtype bridging across the
// remark visitor and rehype hast handler require casts the public
// mdast types cannot carry through. Defensive optional chains on
// array[i] accesses are also kept (noUncheckedIndexedAccess off).
/* oxlint-disable typescript/no-unsafe-type-assertion */
/* oxlint-disable typescript/no-unnecessary-condition */
import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root, Blockquote } from "mdast";
import type { Element, ElementContent, Properties } from "hast";
import type { State } from "mdast-util-to-hast";
import { ALERT_ALIASES, DEFAULT_TITLE } from "./types.js";
import { ICONS } from "./icons.js";
import type { AlertOptions, AlertType } from "./types.js";

export type { AlertOptions, AlertType };
export { ALERT_ALIASES, DEFAULT_TITLE, ICONS };

// Groups: 1=type keyword, 2=foldable marker (+/-), 3=custom title
const ALERT_RE = /^\[!([^\]]+)\]([+-])?\s*(.*)?$/s;

const capitalize = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1);

interface AlertData {
  hName: string;
  hProperties: Properties;
  alertType: string;
  alertTitle: string;
  alertFoldable: boolean;
  alertIcon: string;
  attrsRole: string;
}

type AlertNode = Blockquote & { data: AlertData };

export const remarkGithubAlerts: Plugin<[AlertOptions?], Root> = (
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

  return (tree) => {
    visit(tree, "blockquote", (node: Blockquote) => {
      const firstChild = node.children[0];
      if (firstChild?.type !== "paragraph") return;

      const firstText = firstChild.children[0];
      if (firstText?.type !== "text") return;

      const firstLine = firstText.value.split("\n")[0];
      const match = ALERT_RE.exec(firstLine.trim());
      if (!match) return;

      const [, keyword, foldMarker, customTitle] = match;
      const type = resolve(keyword);
      if (!type) return;

      const isFoldable = foldMarker === "+" || foldMarker === "-";
      const title = customTitle?.trim() || titleFor(type);

      // Strip the marker line; keep any body text on subsequent lines
      const rest = firstText.value.slice(firstLine.length).replace(/^\n/, "");
      if (rest) {
        firstText.value = rest;
      } else {
        node.children.splice(0, 1);
      }

      (node as AlertNode).data = {
        hName: isFoldable ? "details" : "div",
        hProperties: {
          class: containerClass,
          "data-alert": type,
          ...(foldMarker === "+" ? { open: true } : {})
        },
        alertType: type,
        alertTitle: title,
        alertFoldable: isFoldable,
        alertIcon: iconFor(type),
        attrsRole: "container"
      };
    });
  };
};

const svgToHast = (svgString: string): Element | null => {
  if (!svgString) return null;
  // SVG strings from icons.ts are known-safe; embed as raw so rehype-stringify
  // emits them verbatim without requiring allowDangerousHtml on the renderer.
  return {
    type: "element",
    tagName: "span",
    properties: { "aria-hidden": true },
    children: [{ type: "raw", value: svgString } as unknown as ElementContent]
  };
};

const buildTitleElement = (
  tag: "p" | "summary",
  alertTitle: string,
  alertIcon: string,
  containerClass: string
): Element => {
  const icon = svgToHast(alertIcon);
  return {
    type: "element",
    tagName: tag,
    properties: { class: `${containerClass}-title`, "aria-label": alertTitle },
    children: [
      ...(icon ? [icon] : []),
      { type: "text", value: alertTitle }
    ] as ElementContent[]
  };
};

const nl: ElementContent = { type: "text", value: "\n" };

export const githubAlertsHastHandlers = {
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
      return result;
    }

    const containerClass =
      typeof data.hProperties.class === "string"
        ? data.hProperties.class
        : "markdown-alert";
    const titleTag = data.alertFoldable ? "summary" : "p";
    const titleEl = buildTitleElement(
      titleTag,
      data.alertTitle,
      data.alertIcon,
      containerClass
    );
    const bodyChildren = state.all(node);

    const result: Element = {
      type: "element",
      tagName: data.hName,
      properties: data.hProperties,
      children: [
        nl,
        titleEl,
        ...bodyChildren.flatMap((child) => [nl, child]),
        nl
      ]
    };
    state.patch(node, result);
    return result;
  }
} as const;
