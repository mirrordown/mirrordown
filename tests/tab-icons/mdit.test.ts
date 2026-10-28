import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { tabs } from "../../packages/mdit-tabs/src";
import { tabIcons } from "../../packages/mdit-tab-icons/src";
import { fixture } from "./options.js";

const md = new MarkdownIt().use(tabs).use(tabIcons);

describe("tab-icons/mdit", () => {
  // markdown-it writes the expected HTML the other engines are held to.
  it("tab-icons (markdown-it): fixtures", async () => {
    const html = fixture.inputs
      .map(
        ({ name, input }) => `<!-- @case: ${name} -->\n\n${md.render(input)}`
      )
      .join(`\n`);
    await expect(html).toMatchFileSnapshot(fixture.expectedPath);
  });
});
