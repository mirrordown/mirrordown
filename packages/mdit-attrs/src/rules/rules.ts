import type MarkdownIt from "markdown-it";
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
  "block",
];

export const createRules = (
  _md: MarkdownIt,
  options: DelimiterConfig & Pick<AttrsOptions, "rule">,
): AttrRule[] => {
  const { rule = "all" } = options;

  let enabledNames: AttrRuleName[];
  if (rule === "all" || rule === true) {
    enabledNames = ALL_RULE_NAMES;
  } else if (!rule || (Array.isArray(rule) && rule.length === 0)) {
    return [];
  } else {
    enabledNames = (rule as AttrRuleName[]).filter((r) => (ALL_RULE_NAMES as string[]).includes(r));
  }

  const enabled = new Set(enabledNames);
  const rules: AttrRule[] = [];

  if (enabled.has("fence")) rules.push(createFenceRule(options));
  if (enabled.has("inline")) rules.push(...createInlineRules(options));
  if (enabled.has("table")) rules.push(...createTableRules(options));
  if (enabled.has("list")) rules.push(...createListRules(options));
  if (enabled.has("heading")) rules.push(createHeadingRule(options));
  if (enabled.has("hr")) rules.push(createHrRule(options));
  if (enabled.has("softbreak")) rules.push(createSoftbreakRule(options));
  if (enabled.has("block")) rules.push(createBlockRule(options));

  return rules;
};
