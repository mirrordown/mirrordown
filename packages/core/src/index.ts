export {
  escapedIndices,
  maskEscaped,
  unmaskEscaped,
  maskTreeEscapes,
  type TextLikeNode
} from "./escapes.js";
export {
  ALERT_ALIASES,
  DEFAULT_TITLE,
  ICONS,
  createAlertResolver,
  plainText,
  splitAlertParagraph,
  type AlertOptions,
  type AlertParagraph,
  type AlertResolver,
  type AlertType,
  type PhrasingLike
} from "./github-alerts/index.js";
export {
  createDelimitedTransform,
  type DelimitedNodes,
  type DelimitedTransform,
  type DelimiterMarker,
  type Positioned
} from "./delimited.js";
export { scriptSyntax, type ScriptSyntax } from "./scripts.js";
