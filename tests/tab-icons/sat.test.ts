import { describe, expect, it } from "vite-plus/test";
import { markdownToHtml } from "satteri";
import { satteriTabs } from "../../packages/sat-tabs/src";
import { satteriTabIcons } from "../../packages/sat-tab-icons/src";
import { normalizeHtml } from "../utils/index.js";
import { fixture } from "./options.js";

describe("tab-icons/sat", () => {
  it.each(fixture.cases())(
    "tab-icons (sätteri): $name",
    ({ input, expected }) => {
      const { html } = markdownToHtml(input, {
        features: { gfm: false, frontmatter: false, smartPunctuation: false },
        mdastPlugins: [satteriTabs()],
        hastPlugins: [satteriTabIcons()]
      });
      expect(normalizeHtml(html)).toBe(expected);
    }
  );
});
