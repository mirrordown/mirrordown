import type Token from "markdown-it/lib/token.mjs";
import type { DelimiterRange } from "../types.js";
import { getAttrs } from "./getAttrs.js";

export const addAttrs = (
  token: Token,
  content: string,
  range: DelimiterRange,
  allowed: (string | RegExp)[],
): void => {
  for (const [key, value] of getAttrs(content, range, allowed)) {
    if (key === "class" || key === "css-module") {
      token.attrJoin(key, value);
    } else {
      token.attrPush([key, value]);
    }
  }
};
