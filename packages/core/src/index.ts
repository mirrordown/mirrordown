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
  isAlertMarkerLine,
  plainText,
  splitAlertParagraph,
  type AlertOptions,
  type AlertParagraph,
  type AlertResolver,
  type AlertType,
  type PhrasingLike
} from "./github-alerts/index.js";
export { createDelimitedTransform, type DelimiterMarker } from "./delimited.js";
export { createKbdTransform } from "./kbd.js";
export {
  type Positioned,
  type SpanNodes,
  type SpanTransform
} from "./spans.js";
export { scriptSyntax, type ScriptSyntax } from "./scripts.js";
export {
  LIGHTBOX_MARKER,
  headingRank,
  isEmptyParagraph,
  isImageParagraph,
  isCaptionFigure,
  lightboxDialog,
  lightboxId,
  lightboxTrigger,
  sectionize,
  type HastElementLike,
  type HastLike
} from "./hast.js";
export {
  createAbbreviationScan,
  parseAbbreviations,
  type AbbreviationPart
} from "./abbr.js";
export {
  processSteps,
  processStepsInChildren,
  type StepsItemNode,
  type StepsListNode,
  type StepsTitleNode
} from "./steps.js";
export {
  processTabs,
  processTabsInChildren,
  stripAttrs,
  tabLabelText,
  tabsBlockId,
  type TabsItemNode,
  type TabsLabelNode,
  type TabsListNode
} from "./tabs.js";
export { editableTree, type EditableTree, type TreeNode } from "./editable.js";
export { placeCutAttributes, type ReadAttributes } from "./cut-attributes.js";
export {
  inlineSvgMarkup,
  svgSpriteId,
  type InlineSvgLimits
} from "./inline-svg.js";
export {
  hastAttributes,
  mermaidDiagram,
  mermaidFailure,
  mermaidIdPrefixes,
  mermaidSource,
  mermaidSvg,
  type MermaidAttribute
} from "./mermaid-pele.js";
export {
  containersKept,
  itemColumns,
  type LineContainer
} from "./line-containers.js";
export {
  CAPTION_CLASS,
  figureProperties,
  isCaptionLine,
  processCaptions,
  startsCaption,
  stripCaptionMarker
} from "./caption.js";
