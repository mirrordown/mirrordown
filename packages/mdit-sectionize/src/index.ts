import Token from "markdown-it/lib/token.mjs";
import type StateCore from "markdown-it/lib/rules_core/state_core.mjs";
import type { PluginSimple } from "markdown-it";

const HEADING_RANK: Record<string, number> = {
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
  h5: 5,
  h6: 6
};

// Rank of a heading_open token (h1..h6), else null. Only opening heading
// tokens delimit sections; heading_close is ignored so a heading and its
// close stay together inside one section.
const headingRank = (token: Token): number | null => {
  if (token.type !== "heading_open") return null;
  return HEADING_RANK[token.tag] ?? null;
};

const openSection = (depth: number): Token => {
  const token = new Token("section_open", "section", 1);
  token.block = true;
  token.attrSet("data-depth", String(depth));
  return token;
};

const closeSection = (): Token => {
  const token = new Token("section_close", "section", -1);
  token.block = true;
  return token;
};

// Wrap heading-delimited runs of `tokens` in section_open/section_close pairs.
// Only headings strictly deeper than `floor` delimit sections here, so a
// section body (whose own heading is at rank == floor) recurses to wrap just
// its deeper headings — yielding upstream's deepest-first nesting. Content
// before the first qualifying heading stays unwrapped.
const sectionizeTokens = (tokens: Token[], floor: number): Token[] => {
  let minRank = Infinity;
  for (const token of tokens) {
    const rank = headingRank(token);
    if (rank !== null && rank > floor && rank < minRank) minRank = rank;
  }
  if (minRank === Infinity) return tokens;

  const result: Token[] = [];
  let i = 0;

  // Preamble: everything before the first heading of the shallowest rank.
  while (i < tokens.length) {
    const token = tokens[i];
    if (token === undefined || headingRank(token) === minRank) break;
    result.push(token);
    i++;
  }

  // Each shallowest heading starts a section that runs until the next peer.
  while (i < tokens.length) {
    const start = i;
    i++;
    while (i < tokens.length) {
      const token = tokens[i];
      if (token === undefined || headingRank(token) === minRank) break;
      i++;
    }

    result.push(openSection(minRank));
    result.push(...sectionizeTokens(tokens.slice(start, i), minRank));
    result.push(closeSection());
  }

  return result;
};

/** markdown-it plugin that wraps headings and their content in <section> elements. */
export const sectionize: PluginSimple = (md) => {
  md.core.ruler.push("sectionize", (state: StateCore) => {
    state.tokens = sectionizeTokens(state.tokens, 0);
  });
};
