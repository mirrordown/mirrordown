import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { imageSize } from "../../packages/mdit-image-size/src";
import { unwrapImages } from "../../packages/mdit-unwrap-images/src";
import { normalizeHtml } from "../utils/index.js";
import { engines } from "../presets/engines.js";
import { only } from "./presets.js";

describe.each(engines)("image-size + unwrap-images (%s)", (_engine, render) => {
  const html = render(only(`imageSize`, `unwrapImages`));

  it("unwraps a sized image that is alone in its paragraph", () => {
    expect(html("![a|100x145](u.jpg)")).toBe(
      '<img src="u.jpg" alt="a" width="100" height="145">'
    );
  });

  it("unwraps two sized images with a space between them", () => {
    expect(html("![a|100](a.jpg) ![b|200](b.jpg)")).toBe(
      '<img src="a.jpg" alt="a" width="100"> <img src="b.jpg" alt="b" width="200">'
    );
  });

  it("unwraps a sized image inside a link", () => {
    expect(html("[![a|100](a.jpg)](https://example.com)")).toBe(
      '<a href="https://example.com"><img src="a.jpg" alt="a" width="100"></a>'
    );
  });

  it("keeps the paragraph of a sized image beside text", () => {
    expect(html("See ![a|100](a.jpg)")).toBe(
      '<p>See <img src="a.jpg" alt="a" width="100"></p>'
    );
  });
});

// unwrap-images takes an image out of its inline token, where the markdown-it plugin looks for images. The plugin's rule runs before unwrap-images' whichever is added first, so the order the two are added in does not matter.
describe("image-size + unwrap-images: markdown-it in either order", () => {
  it("sizes an image that unwrap-images unwraps, added before or after it", () => {
    const after = new MarkdownIt().use(unwrapImages).use(imageSize);
    const before = new MarkdownIt().use(imageSize).use(unwrapImages);
    const expected = '<img src="u.jpg" alt="a" width="100">';
    expect(normalizeHtml(after.render("![a|100](u.jpg)"))).toBe(expected);
    expect(normalizeHtml(before.render("![a|100](u.jpg)"))).toBe(expected);
  });
});
