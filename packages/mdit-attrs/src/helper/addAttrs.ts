import type Token from "markdown-it/lib/token.mjs";
import type { DelimiterRange } from "../types.js";
import { getAttrs } from "./getAttrs.js";

export const addAttrs = (
  token: Token,
  content: string,
  range: DelimiterRange,
  allowed: Array<string | RegExp>
): void => {
  for (const [key, value] of getAttrs(content, range, allowed)) {
    if (key === "class" || key === "css-module") {
      token.attrJoin(key, value);
    } else {
      // Replace a value the token already has, as remark and Sätteri do: pushing a second attribute of the same name is invalid HTML, of which browsers keep the first.
      token.attrSet(key, value);
    }
  }
};
