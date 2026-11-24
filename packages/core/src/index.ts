export {
  carryEscapes,
  escapedIndices,
  maskEscaped,
  unmaskEscaped,
  maskTreeEscapes,
  textEscapes,
  type TextLikeNode
} from "./escapes.js";
export {
  ALERT_ALIASES,
  DEFAULT_TITLE,
  ICONS,
  createAlertResolver,
  isAlertMarkerLine,
  matchAlertMarker,
  plainText,
  splitAlertParagraph,
  type AlertMarker,
  type AlertOptions,
  type AlertParagraph,
  type AlertResolver,
  type AlertType,
  type PhrasingLike
} from "./github-alerts/index.js";
export { createDelimitedTransform, type DelimiterMarker } from "./delimited.js";
export {
  HIGHLIGHT_MARKERS,
  createHighlightMarkers,
  type HighlightMarker,
  type HighlightMarkers,
  type HighlightVariant,
  type MarkOptions
} from "./highlight-markers.js";
export { createKbdTransform } from "./kbd.js";
export {
  scanSpans,
  type Positioned,
  type SpanHost,
  type SpanNodes,
  type SpanParent,
  type SpanTransform
} from "./spans.js";
export {
  addProperties,
  claimTrailingAttributes,
  createAttributeReader,
  leadingAttributes
} from "./span-attributes.js";
export { scriptSyntax, type ScriptSyntax } from "./scripts.js";
export {
  LIGHTBOX_MARKER,
  MARKDOWN_PARAGRAPH,
  headingRank,
  isEmptyParagraph,
  isImageParagraph,
  isCaptionFigure,
  lightboxDialog,
  lightboxId,
  lightboxTrigger,
  sectionize,
  unwrapImageParagraph,
  type HastElementLike,
  type HastLike
} from "./hast.js";
export {
  createAbbreviationScan,
  parseAbbreviations,
  type AbbreviationPart
} from "./abbr.js";
export {
  createTagCollector,
  scanTags,
  tagAncestors,
  tagChildren,
  tagHref,
  tagKey,
  type TagNodes,
  type TagPart,
  type TagsOptions
} from "./tags.js";
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
export {
  COPY_CODE_CLASS,
  COPY_CODE_COMMAND,
  COPY_CODE_ICONS,
  COPY_CODE_TEXT,
  copyCodeBlock,
  copyCodeIds,
  copyCodeOptedOut,
  copyCodeText,
  createCopyCodeButton,
  type CopyCodeOptions,
  type CopyCodeState
} from "./copy-code.js";
export { parseImageSize, type ImageSize } from "./image-size.js";
export {
  TASK_MARKERS,
  createTaskResolver,
  matchTaskBox,
  startAfterBox,
  type TaskBox,
  type TaskBoxContext,
  type TaskBoxMatch,
  type TaskListsOptions,
  type TaskMarkerResolver,
  type TaskPoint
} from "./task-lists.js";
export {
  blankAfterMarker,
  cutMarker,
  processBlockIds,
  resolveBlockIds,
  titleMarkerWritten,
  trailingMarker,
  trimBlankEnd,
  type BlockIdEdits,
  type BlockMarker
} from "./block-ids.js";
