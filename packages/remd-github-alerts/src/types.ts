export type AlertType =
  | "note"
  | "tip"
  | "important"
  | "warning"
  | "caution"
  | "abstract"
  | "info"
  | "todo"
  | "success"
  | "question"
  | "failure"
  | "danger"
  | "bug"
  | "example"
  | "quote";

// Maps every recognized keyword (lowercase) to its canonical AlertType.
// Aliases collapse so CSS only needs one selector per canonical type.
export const ALERT_ALIASES: Record<string, AlertType> = {
  // GitHub 5
  note: "note",
  tip: "tip",
  important: "important",
  warning: "warning",
  caution: "caution",
  // Obsidian extended
  abstract: "abstract",
  summary: "abstract",
  tldr: "abstract",
  info: "info",
  todo: "todo",
  hint: "tip",
  success: "success",
  check: "success",
  done: "success",
  question: "question",
  help: "question",
  faq: "question",
  attention: "warning",
  failure: "failure",
  fail: "failure",
  missing: "failure",
  danger: "danger",
  error: "danger",
  bug: "bug",
  example: "example",
  quote: "quote",
  cite: "quote",
};

export const DEFAULT_TITLE: Record<AlertType, string> = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution",
  abstract: "Abstract",
  info: "Info",
  todo: "Todo",
  success: "Success",
  question: "Question",
  failure: "Failure",
  danger: "Danger",
  bug: "Bug",
  example: "Example",
  quote: "Quote",
};

export interface AlertOptions {
  /**
   * Extra alert types beyond the built-in set. Keys are lowercase keywords
   * (including any aliases you want), values are the canonical type string
   * that appears in the data-alert attribute and CSS class.
   */
  types?: Record<string, string>;
  /** Default display titles, keyed by canonical type. */
  titles?: Partial<Record<AlertType, string>>;
  /** Set false to require exact case on the [!TYPE] keyword. Default: true. */
  matchCaseInsensitive?: boolean;
  /** Set false to suppress the SVG icon in the title. Default: true. */
  icons?: boolean;
  /** CSS class applied to the alert container. Default: "markdown-alert". */
  containerClass?: string;
}
