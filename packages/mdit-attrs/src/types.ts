export type AttrRuleName =
  | "fence"
  | "inline"
  | "table"
  | "list"
  | "heading"
  | "hr"
  | "softbreak"
  | "block";

export interface DelimiterConfig {
  left: string;
  right: string;
  allowed: (string | RegExp)[];
}

export interface AttrsOptions extends Partial<DelimiterConfig> {
  /**
   * Which rules to enable. "all" enables everything (default). false or []
   * disables all rules. An array of rule names enables only those rules.
   */
  rule?: "all" | boolean | AttrRuleName[];
}

export type Attr = [key: string, value: string];

/** [startIndex, endIndex] within the token content string, exclusive of delimiters */
export type DelimiterRange = [start: number, end: number];
