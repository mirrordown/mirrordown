import type Token from "markdown-it/lib/token.mjs";
import type { DelimiterRange } from "../types.js";
import type { RuleTest } from "../helper/testRule.js";

export interface AttrRule {
  name: string;
  tests: RuleTest[];
  transform(
    tokens: Token[],
    index: number,
    position: number,
    range: DelimiterRange,
  ): boolean | void;
}
