import type Token from "markdown-it/lib/token.mjs";

/**
 * Given a closing or self-closing token at `index`, returns its matching
 * opening token by walking backwards to find the token of the same type at
 * the same nesting level. Returns the token itself for nesting === 0.
 */
export const getMatchingOpeningToken = (
  tokens: Token[],
  index: number
): Token | null => {
  const token = tokens[index];
  // oxlint-disable-next-line typescript/no-unnecessary-condition
  if (!token) return null;
  if (token.type === "softbreak") return null;
  if (token.nesting === 0) return token;

  const target = token.type.replace(/_close$/, "_open");
  let depth = 0;

  for (let i = index; i >= 0; i--) {
    const t = tokens[i];
    if (t.type === token.type) depth++;
    else if (t.type === target) {
      depth--;
      if (depth === 0) return t;
    }
  }

  return null;
};
