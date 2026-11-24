import type Token from "markdown-it/lib/token.mjs";
import type { DelimiterRange } from "../types.js";
import type { RuleTest } from "../helper/testRule.js";

/**
 * The document one run of the rules reads. What a rule would otherwise work out from the whole document for each block it places is worked out here, once per run and only when a rule first asks: a cost per block that grows with the document makes a document of many blocks quadratic. Nothing here outlives the run.
 */
export interface AttrDocument {
  /** The document's source, which token maps index by line. */
  src: string;
  /** `source`, the document's or a container's own, split into lines. */
  lines(source: string): string[];
  /** The nearest token before `token` that opens a block at a lower level than it: the block that holds it. */
  parent(token: Token): Token | undefined;
}

export interface AttrRule {
  name: string;
  tests: RuleTest[];
  transform(
    tokens: Token[],
    index: number,
    position: number,
    range: DelimiterRange,
    doc: AttrDocument
  ): boolean | undefined;
}
