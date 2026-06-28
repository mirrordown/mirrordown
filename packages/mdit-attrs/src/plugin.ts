import type { PluginWithOptions } from "markdown-it";
import type { AttrsOptions, DelimiterRange } from "./types.js";
import { createRules } from "./rules/index.js";
import { testRule } from "./helper/index.js";

/** markdown-it plugin for attribute lists (`{.class #id key=value}`) on elements. */
export const attrs: PluginWithOptions<AttrsOptions> = (
  md,
  { left = "{", right = "}", allowed = [], rule = "all" } = {}
) => {
  const rules = createRules({ left, right, allowed, rule });

  md.core.ruler.before("linkify", "attrs", (state) => {
    const { tokens } = state;

    for (let index = 0; index < tokens.length; index++) {
      for (let ruleIndex = 0; ruleIndex < rules.length; ruleIndex++) {
        const pattern = rules[ruleIndex];
        let position: number | null = null;
        let range: DelimiterRange | null = null;

        const match = pattern.tests.every((test) => {
          const result = testRule(tokens, index, test);
          if (result.position != null) position = result.position;
          if (result.range) range = result.range;
          return result.match;
        });

        if (match) {
          const modified = pattern.transform(tokens, index, position!, range!);

          if (
            modified !== false &&
            (pattern.name === "inline attributes" ||
              pattern.name === "inline nesting self-close")
          ) {
            ruleIndex--;
          }
        }
      }
    }
  });
};
