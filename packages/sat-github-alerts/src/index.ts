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
  options: { position: boolean };
  blockquote: (...args: Parameters<BlockquoteVisitor>) => void;
}

/**
 * Sätteri plugin for GitHub-style alerts/admonitions (`> [!NOTE]`, `> [!WARNING]`, …). Sätteri has no mdast→hast handler hook, so an alert blockquote becomes custom nodes that render through `hName`/`hProperties`; the marker-line rule and option handling are shared with the markdown-it and remark plugins through `@mirrordown/core`.
 */
export const satteriGithubAlerts =
  (
    options: AlertOptions = {}
  ): ((ctx: PluginFactoryContext) => GithubAlertsPlugin) =>
  ({ source }) => {
    const { resolve, titleFor, iconFor, containerClass } =
      createAlertResolver(options);
    return defineMdastPlugin({
      name: "github-alerts",
      // Positions and the source tell an escaped marker (`\[!NOTE]`) from a real one.
      options: { position: true },
      blockquote(node, ctx) {
        const [first, ...rest] = node.children;
        if (first?.type !== "paragraph") return;
        const alert = splitAlertParagraph(first.children, source);
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
            // A title without plain text (an image with no alt) is still the title; the default one then only labels it.
            ...(alert.titleNodes.length > 0
              ? alert.titleNodes
              : [{ type: "text", value: title }])
          ]
        };
        const body =
          alert.bodyNodes.length > 0
            ? [{ ...first, children: alert.bodyNodes }, ...rest]
            : rest;

        // Sätteri reads attribute blocks while it parses, and has put one written for the blockquote (on a line after it, without its `>`) on the node this one replaces: the alert keeps them, as it does in the other engines.
        const data: unknown = node.data;
        const written: Record<string, unknown> =
          typeof data === "object" &&
          data !== null &&
          "hProperties" in data &&
          typeof data.hProperties === "object" &&
          data.hProperties !== null
            ? { ...data.hProperties }
            : {};
        const { className, ...attributes } = written;
        ctx.replaceNode(node, {
          type: "alert",
          data: {
            hName: alert.fold ? "details" : "div",
            hProperties: {
              className: [
                containerClass,
                ...(Array.isArray(className) ? className : [])
              ],
              dataAlert: type,
              ...(alert.fold === "+" ? { open: true } : {}),
              ...attributes
            }
          },
          children: [titleNode, ...body]
        });
      }
    });
  };
