/** A markdown-it rule that attribute lists can be attached to. */
export type AttrRuleName =
  | "fence"
  | "inline"
  | "table"
  | "list"
  | "heading"
  | "hr"
  | "softbreak"
  | "block";

/** Delimiters and allowed characters for the attribute-list syntax. */
export interface DelimiterConfig {
  /** Opening delimiter (default `{`). */
  left: string;
  /** Closing delimiter (default `}`). */
  right: string;
  /** Characters/patterns permitted inside the delimiters. */
  allowed: Array<string | RegExp>;
}

/** Options for the {@link attrs} plugin. */
export interface AttrsOptions extends Partial<DelimiterConfig> {
  /**
   * Which rules to enable. "all" enables everything (default). false or []
   * disables all rules. An array of rule names enables only those rules.
   */
  rule?: "all" | boolean | AttrRuleName[];
}

/** A parsed `[key, value]` attribute pair. */
export type Attr = [key: string, value: string];

/** [startIndex, endIndex] within the token content string, exclusive of delimiters */
export type DelimiterRange = [start: number, end: number];
