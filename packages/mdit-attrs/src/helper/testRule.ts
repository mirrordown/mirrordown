import type Token from "markdown-it/lib/token.mjs";
import type { DelimiterRange } from "../types.js";
import type { DelimiterChecker } from "./getDelimiterChecker.js";

export interface RuleTest {
  /** Offset from the current token index. Mutually exclusive with `position`. */
  shift?: number;
  /** Absolute token index. Mutually exclusive with `shift`. */
  position?: number;
  /** Token type must equal this string. */
  type?: string | ((t: string) => boolean);
  /** Token tag must equal this string. */
  tag?: string;
  /** Token nesting must equal this value. */
  nesting?: number | ((n: number) => boolean);
  /** Inspect token content; called with (content, token, tokens, index). */
  content?: string | ((c: string) => boolean);
  /** Inspect token.meta; predicate receives the meta object (may be null). */
  meta?: (meta: Record<string, unknown> | null) => boolean;
  /** Inspect a child token at the given index (negative = from end). */
  children?: Array<Omit<RuleTest, "shift" | "position"> & { index?: number }>;
  /** If set, use this delimiter checker to extract a range from token content. */
  attrChecker?: DelimiterChecker;
  /** Which position argument to pass to attrChecker ("start"|"end"|"only"). */
  attrPos?: "start" | "end" | "only";
}

export interface TestResult {
  match: boolean;
  position: number | null;
  range: DelimiterRange | null;
}

const matches = (test: unknown, actual: unknown): boolean => {
  if (typeof test === "function") return (test as (v: unknown) => boolean)(actual);
  return test === actual;
};

const testChild = (
  child: Token,
  childTest: Omit<RuleTest, "shift" | "position">,
): { match: boolean; range: DelimiterRange | null } => {
  let range: DelimiterRange | null = null;

  if (childTest.type !== undefined && !matches(childTest.type, child.type)) {
    return { match: false, range: null };
  }
  if (childTest.nesting !== undefined && !matches(childTest.nesting, child.nesting)) {
    return { match: false, range: null };
  }
  if (childTest.tag !== undefined && child.tag !== childTest.tag) {
    return { match: false, range: null };
  }
  if (childTest.content !== undefined) {
    if (!matches(childTest.content, child.content)) return { match: false, range: null };
  }
  if (childTest.attrChecker) {
    range = childTest.attrChecker(child.content, childTest.attrPos ?? "only");
    if (!range) return { match: false, range: null };
  }

  return { match: true, range };
};

export const testRule = (tokens: Token[], index: number, test: RuleTest): TestResult => {
  let tokenIndex: number;
  if (test.position !== undefined) {
    tokenIndex = test.position < 0 ? tokens.length + test.position : test.position;
  } else {
    tokenIndex = index + (test.shift ?? 0);
  }

  const token = tokens[tokenIndex];
  if (!token) return { match: false, position: null, range: null };

  let range: DelimiterRange | null = null;

  if (test.type !== undefined && !matches(test.type, token.type)) {
    return { match: false, position: null, range: null };
  }
  if (test.nesting !== undefined && !matches(test.nesting, token.nesting)) {
    return { match: false, position: null, range: null };
  }
  if (test.tag !== undefined && token.tag !== test.tag) {
    return { match: false, position: null, range: null };
  }
  if (test.content !== undefined && !matches(test.content, token.content)) {
    return { match: false, position: null, range: null };
  }
  if (test.meta !== undefined && !test.meta((token.meta as Record<string, unknown> | null) ?? null)) {
    return { match: false, position: null, range: null };
  }
  if (test.attrChecker) {
    range = test.attrChecker(token.content, test.attrPos ?? "only");
    if (!range) return { match: false, position: null, range: null };
  }

  if (test.children) {
    const children = token.children ?? [];
    for (const childTest of test.children) {
      const idx =
        childTest.index !== undefined
          ? childTest.index < 0
            ? children.length + childTest.index
            : childTest.index
          : -1;

      if (idx >= 0) {
        const child = children[idx];
        if (!child) return { match: false, position: null, range: null };
        const result = testChild(child, childTest);
        if (!result.match) return { match: false, position: null, range: null };
        if (result.range) range = result.range;
      } else {
        // No index: find any matching child
        const found = children.some((child) => {
          const result = testChild(child, childTest);
          if (result.range) range = result.range;
          return result.match;
        });
        if (!found) return { match: false, position: null, range: null };
      }
    }
  }

  return { match: true, position: tokenIndex, range };
};
