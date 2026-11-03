import { describe, expect, it } from "vite-plus/test";
import { markdownToHtml } from "satteri";
import {
  satteriPrompt,
  satteriPromptPreview
} from "../../packages/sat-prompt/src";
import { normalizeHtml } from "../utils/index.js";
import { fixtures, type Syntax } from "./options.js";

describe.each(Object.keys(fixtures) as Syntax[])("prompt/sat: %s", (syntax) => {
  it.each(fixtures[syntax].cases())(
    "prompt (sätteri): $name",
    ({ input, expected }) => {
      // The page's syntax is what a preview renders: GFM, or CommonMark, which passes raw HTML on as it is.
      const { html } = markdownToHtml(input, {
        features: {
          gfm: syntax === `gfm`,
          frontmatter: false,
          smartPunctuation: false
        },
        mdastPlugins: [satteriPromptPreview()],
        hastPlugins: [satteriPrompt()]
      });
      expect(normalizeHtml(html)).toBe(expected);
    }
  );
});
