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
  rule?: "all" | boolean | AttrRuleName[];
}

export type Attr = [key: string, value: string];
export type DelimiterRange = [start: number, end: number];
