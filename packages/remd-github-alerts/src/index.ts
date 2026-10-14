// The AlertNode subtype bridging the remark visitor and the rehype hast handler
// requires casts the public mdast types cannot carry through. Defensive
// optional chains on array[i] accesses are kept (an empty blockquote has none).
/* oxlint-disable typescript/no-unsafe-type-assertion */
/* oxlint-disable typescript/no-unnecessary-condition */
import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root, Blockquote, PhrasingContent } from "mdast";
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
  const { resolve, titleFor, iconFor, containerClass } =
    createAlertResolver(options);

  return (tree) => {
    visit(tree, "blockquote", (node: Blockquote) => {
      const firstChild = node.children[0];
      if (firstChild?.type !== "paragraph") return;

      // The marker line rule (title, formatting included; body after the
      // first line break) is shared with every engine in @mirrordown/core.
      const alert = splitAlertParagraph(firstChild.children);
      if (!alert) return;
      const type = resolve(alert.keyword);
      if (!type) return;

      if (alert.bodyNodes.length > 0) {
        firstChild.children = alert.bodyNodes;
      } else {
        node.children.splice(0, 1);
      }

      (node as AlertNode).data = {
        hName: alert.fold ? "details" : "div",
        hProperties: {
          class: containerClass,
          "data-alert": type,
          ...(alert.fold === "+" ? { open: true } : {})
        },
        alertType: type,
        alertTitle: alert.titleText || titleFor(type),
        ...(alert.titleText ? { alertTitleNodes: alert.titleNodes } : {}),
        alertFoldable: alert.fold !== undefined,
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
