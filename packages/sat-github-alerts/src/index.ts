import {
  ALERT_ALIASES,
  DEFAULT_TITLE,
  ICONS,
  createAlertResolver,
  splitAlertParagraph,
  type AlertOptions,
  type AlertType
} from "@mirrordown/core";
import {
  defineMdastPlugin,
  type MdastPluginInstance,
  type PluginFactoryContext
} from "satteri";

export type { AlertOptions, AlertType };
export { ALERT_ALIASES, DEFAULT_TITLE, ICONS };

type BlockquoteVisitor = NonNullable<MdastPluginInstance["blockquote"]>;

/**
 * The plugin's definition: only the keys it defines, with a synchronous visitor, so `markdownToHtml` returns its result directly.
 */
export interface GithubAlertsPlugin {
  name: string;
  blockquote: (...args: Parameters<BlockquoteVisitor>) => void;
}

/**
 * Sätteri plugin for GitHub-style alerts/admonitions (`> [!NOTE]`, `> [!WARNING]`, …). Sätteri has no mdast→hast handler hook, so an alert blockquote becomes custom nodes that render through `hName`/`hProperties`; the marker-line rule and option handling are shared with the markdown-it and remark plugins through `@mirrordown/core`.
 */
export const satteriGithubAlerts =
  (
    options: AlertOptions = {}
  ): ((ctx: PluginFactoryContext) => GithubAlertsPlugin) =>
  () => {
    const { resolve, titleFor, iconFor, containerClass } =
      createAlertResolver(options);
    return defineMdastPlugin({
      name: "github-alerts",
      blockquote(node, ctx) {
        const [first, ...rest] = node.children;
        if (first?.type !== "paragraph") return;
        const alert = splitAlertParagraph(first.children);
        if (!alert) return;
        const type = resolve(alert.keyword);
        if (!type) return;

        const title = alert.titleText || titleFor(type);
        const icon = iconFor(type);
        const titleNode = {
          type: "alertTitle",
          data: {
            hName: alert.fold ? "summary" : "p",
            hProperties: {
              className: [`${containerClass}-title`],
              ariaLabel: title
            }
          },
          children: [
            ...(icon ? [{ type: "html", value: icon }] : []),
            ...(alert.titleText
              ? alert.titleNodes
              : [{ type: "text", value: title }])
          ]
        };
        const body =
          alert.bodyNodes.length > 0
            ? [{ ...first, children: alert.bodyNodes }, ...rest]
            : rest;

        ctx.replaceNode(node, {
          type: "alert",
          data: {
            hName: alert.fold ? "details" : "div",
            hProperties: {
              className: [containerClass],
              dataAlert: type,
              ...(alert.fold === "+" ? { open: true } : {})
            }
          },
          children: [titleNode, ...body]
        });
      }
    });
  };
