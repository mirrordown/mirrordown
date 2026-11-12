import type { AttrsOptions, AttrRuleName, DelimiterConfig } from "../types.js";
import type { AttrRule } from "./types.js";
import { createBlockRule } from "./block.js";
import { createInlineRules } from "./inline.js";
import { createFenceRule } from "./fence.js";
import { createHeadingRule } from "./heading.js";
import { createHrRule } from "./hr.js";
import { createListRules } from "./list.js";
import { createSoftbreakRule } from "./softbreak.js";
import { createTableRules } from "./table.js";

const ALL_RULE_NAMES: AttrRuleName[] = [
  "fence",
  "inline",
  "table",
  "list",
  "heading",
  "hr",
  "softbreak",
  "block"
];

const ALL_RULE_SET = new Set<string>(ALL_RULE_NAMES);

export const createRules = (
  options: DelimiterConfig & Pick<AttrsOptions, "rule">,
  /** markdown-it's `utils.unescapeAll`, which resolves a fence's info string. */
  unescapeAll: (str: string) => string
): AttrRule[] => {
  const { rule = "all" } = options;

  let enabled: Set<string>;
  if (rule === "all" || rule === true) {
    enabled = ALL_RULE_SET;
  } else if (!rule || (Array.isArray(rule) && rule.length === 0)) {
    return [];
  } else {
    // A name that is no rule used to be dropped, so a typo read no block at all without a word.
    const names: readonly string[] = Array.isArray(rule) ? rule : [rule];
    const unknown = names.find((name) => !ALL_RULE_SET.has(name));
    if (unknown !== undefined) {
      throw new TypeError(
        `attrs: unknown rule "${unknown}". Use one of: ${ALL_RULE_NAMES.join(", ")}.`
      );
    }
    enabled = new Set(names);
  }

  const rules: AttrRule[] = [];

  if (enabled.has("fence")) rules.push(createFenceRule(options, unescapeAll));
  if (enabled.has("inline")) rules.push(...createInlineRules(options));
  // Before the list rules, so a list item's line of its own is placed before
  // the item reads a block ending its first line.
  if (enabled.has("softbreak")) rules.push(createSoftbreakRule(options));
  if (enabled.has("table")) rules.push(...createTableRules(options));
  if (enabled.has("list")) rules.push(...createListRules(options));
  if (enabled.has("heading")) rules.push(createHeadingRule(options));
  if (enabled.has("hr")) rules.push(createHrRule(options));
  if (enabled.has("block")) rules.push(createBlockRule(options));

  return rules;
};
