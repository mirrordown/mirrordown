import { describe, expect, it } from "vite-plus/test";
import { normalizeHtml } from "./index.js";

// Every parity test compares engines through normalizeHtml, so anything it erases is a difference no test in the suite can see.
describe("normalizeHtml", () => {
  it("drops the line breaks engines put between block tags, which is serializer style", () => {
    expect(normalizeHtml("<p>a</p>\n<p>b</p>\n")).toBe("<p>a</p><p>b</p>");
    expect(normalizeHtml("<ul>\n  <li>a</li>\n</ul>")).toBe(
      "<ul><li>a</li></ul>"
    );
  });

  it("keeps a space between inline tags, so an engine that drops it fails", () => {
    expect(normalizeHtml("<p><em>a</em> <code>b</code></p>")).toBe(
      "<p><em>a</em> <code>b</code></p>"
    );
  });

  it("keeps a non-breaking space between tags, so an emptied element is not equal to a deliberate one", () => {
    expect(normalizeHtml("<li> </li>")).not.toBe(normalizeHtml("<li></li>"));
  });
});
