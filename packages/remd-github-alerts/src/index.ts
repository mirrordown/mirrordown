// AlertType cast and the AlertNode subtype bridging across the
// remark visitor and rehype hast handler require casts the public
// mdast types cannot carry through. Defensive optional chains on
// array[i] accesses are also kept (noUncheckedIndexedAccess off).
/* oxlint-disable typescript/no-unsafe-type-assertion */
/* oxlint-disable typescript/no-unnecessary-condition */
import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root, Blockquote, PhrasingContent } from "mdast";
import type { Element, ElementContent, Properties } from "hast";
import type { State, Handler } from "mdast-util-to-hast";
import { ALERT_ALIASES, DEFAULT_TITLE } from "./types.js";
import { ICONS } from "./icons.js";
import type { AlertOptions, AlertType } from "./types.js";

export type { AlertOptions, AlertType };
export { ALERT_ALIASES, DEFAULT_TITLE, ICONS };

// Groups: 1=type keyword, 2=foldable marker (+/-)
const MARKER_RE = /^\[!([^\]]+)\]([+-])?/;

// Plain text of inline content, for the title's aria-label: text, inline code
// and image alt count; raw HTML does not.
const plainText = (nodes: PhrasingContent[]): string =>
  nodes
    .map((n) =>
      n.type === "text" || n.type === "inlineCode"
        ? n.value
        : n.type === "image"
          ? (n.alt ?? "")
          : "children" in n
            ? plainText(n.children)
            : ""
    )
    .join("");

const capitalize = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1);

interface AlertData {
  hName: string;
  hProperties: Properties;
  alertType: string;
  alertTitle: string;
  alertTitleNodes?: PhrasingContent[];
  alertFoldable: boolean;
  alertIcon: string;
  attrsRole: string;
}

type AlertNode = Blockquote & { data: AlertData };

/** remark plugin for GitHub-style alerts/admonitions (`> [!NOTE]`, `> [!WARNING]`, …). */
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

      const match = MARKER_RE.exec(firstText.value.trimStart());
      if (!match) return;

      const [marker, keyword, foldMarker] = match;
      const type = resolve(keyword);
      if (!type) return;

      const isFoldable = foldMarker === "+" || foldMarker === "-";

      // The first line is the marker plus an optional title (inline content,
      // formatting included); everything after the first line break, soft (a
      // newline inside a text node) or hard (a `break` node), is the body.
      const line: PhrasingContent[] = [];
      const body: PhrasingContent[] = [];
      const children: PhrasingContent[] = [
        {
          ...firstText,
          value: firstText.value.trimStart().slice(marker.length)
        },
        ...firstChild.children.slice(1)
      ];
      for (const child of children) {
        if (body.length > 0 || line.at(-1)?.type === "break") {
          body.push(child);
        } else if (child.type === "text" && child.value.includes("\n")) {
          const at = child.value.indexOf("\n");
          line.push({ ...child, value: child.value.slice(0, at) });
          body.push({ ...child, value: child.value.slice(at + 1) });
        } else {
          line.push(child);
        }
      }
      if (line.at(-1)?.type === "break") line.pop();
      const titleNodes = line
        .map((n, i) =>
          n.type !== "text"
            ? n
            : {
                ...n,
                value:
                  i === 0
                    ? n.value.trimStart()
                    : i === line.length - 1
                      ? n.value.trimEnd()
                      : n.value
              }
        )
        .filter((n) => n.type !== "text" || n.value !== "");
      const last = titleNodes.at(-1);
      if (last?.type === "text") last.value = last.value.trimEnd();
      const titleText = plainText(titleNodes).trim();

      const bodyNodes = body.filter((n) => n.type !== "text" || n.value !== "");
      if (bodyNodes.length > 0) {
        firstChild.children = bodyNodes;
      } else {
        node.children.splice(0, 1);
      }

      const title = titleText || titleFor(type);

      (node as AlertNode).data = {
        hName: isFoldable ? "details" : "div",
        hProperties: {
          class: containerClass,
          "data-alert": type,
          ...(foldMarker === "+" ? { open: true } : {})
        },
        alertType: type,
        alertTitle: title,
        ...(titleText ? { alertTitleNodes: titleNodes } : {}),
        alertFoldable: isFoldable,
        alertIcon: iconFor(type),
        attrsRole: "container"
      };
    });
  };
};

// SVG strings from icons.ts are known-safe and already carry
// aria-hidden="true"; embed them as raw so rehype-stringify emits them verbatim
// without requiring allowDangerousHtml on the renderer.
const svgToHast = (svgString: string): ElementContent | null =>
  svgString
    ? ({ type: "raw", value: svgString } as unknown as ElementContent)
    : null;

const buildTitleElement = (
  state: State,
  tag: "p" | "summary",
  data: AlertData,
  containerClass: string
): Element => {
  const icon = svgToHast(data.alertIcon);
  const title: ElementContent[] = data.alertTitleNodes
    ? state.all({ type: "paragraph", children: data.alertTitleNodes })
    : [{ type: "text", value: data.alertTitle }];
  return {
    type: "element",
    tagName: tag,
    properties: {
      class: `${containerClass}-title`,
      "aria-label": data.alertTitle
    },
    children: [...(icon ? [icon] : []), ...title]
  };
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
      return result;
    }

    const containerClass =
      typeof data.hProperties.class === "string"
        ? data.hProperties.class
        : "markdown-alert";
    const titleTag = data.alertFoldable ? "summary" : "p";
    const titleEl = buildTitleElement(state, titleTag, data, containerClass);
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
};
