import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { copyCode } from "../../packages/mdit-copy-code/src";
import { fixture } from "./options.js";

const md = new MarkdownIt().use(copyCode);

describe("copy-code/mdit", () => {
  // markdown-it writes the expected HTML the other engines are held to.
  it("copy-code (markdown-it): fixtures", async () => {
    const html = fixture.inputs
      .map(
        ({ name, input }) => `<!-- @case: ${name} -->\n\n${md.render(input)}`
      )
      .join(`\n`);
    await expect(html).toMatchFileSnapshot(fixture.expectedPath);
  });
});
