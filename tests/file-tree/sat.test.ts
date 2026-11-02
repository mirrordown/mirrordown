import { describe, expect, it } from "vite-plus/test";
import { markdownToHtml } from "satteri";
import { satteriFileTree } from "../../packages/sat-file-tree/src";
import { normalizeHtml } from "../utils/index.js";
import { fixture } from "./options.js";

describe("file-tree/sat", () => {
  it.each(fixture.cases())(
    "file-tree (sätteri): $name",
    ({ input, expected }) => {
      const { html } = markdownToHtml(input, {
        features: { gfm: false, frontmatter: false, smartPunctuation: false },
        hastPlugins: [satteriFileTree()]
      });
      expect(normalizeHtml(html)).toBe(expected);
    }
  );
});
