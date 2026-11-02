import { describe, expect, it } from "vite-plus/test";
import { markdownToHtml } from "satteri";
import { satteriCopyCode } from "../../packages/sat-copy-code/src";
import { normalizeHtml } from "../utils/index.js";
import { fixture } from "./options.js";

describe("copy-code/sat", () => {
  it.each(fixture.cases())(
    "copy-code (sätteri): $name",
    ({ input, expected }) => {
      const { html } = markdownToHtml(input, {
        features: { gfm: false, frontmatter: false, smartPunctuation: false },
        hastPlugins: [satteriCopyCode()]
      });
      expect(normalizeHtml(html)).toBe(expected);
    }
  );
});
