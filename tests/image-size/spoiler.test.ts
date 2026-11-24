import { describe, expect, it } from "vite-plus/test";
import { engines, markdownIt, remark, satteri } from "../presets/engines.js";
import { only } from "./presets.js";

const spoiler = (content: string): string =>
  `<label class="markdown-spoiler"><input type="checkbox" class="markdown-spoiler-toggle" aria-label="spoiler"><span class="markdown-spoiler-content">${content}</span></label>`;

describe.each(engines)("image-size + spoiler (%s)", (_engine, render) => {
  const html = render(only(`imageSize`, `spoiler`));

  // The spoiler's two pipes are outside the image, so the single `|` inside is the size's.
  it("hides a sized image", () => {
    expect(html("||![a|100](u.jpg)||")).toBe(
      `<p>${spoiler('<img src="u.jpg" alt="a" width="100">')}</p>`
    );
  });

  it("hides a sized image beside text", () => {
    expect(html("A ||twist ![a|100x50](u.jpg)|| here")).toBe(
      `<p>A ${spoiler('twist <img src="u.jpg" alt="a" width="100" height="50">')} here</p>`
    );
  });
});

// A spoiler written inside a description is the engines' own difference (the spoiler guide states it): markdown-it reads it as a spoiler and drops its pipes from the alt, remark and Sätteri keep the text as written. The size after it is read in all three.
describe("image-size + spoiler: a spoiler inside the description", () => {
  const input = "![a ||b|| c|100](u.jpg)";
  const options = only(`imageSize`, `spoiler`);

  it("markdown-it drops the spoiler's pipes from the alt", () => {
    expect(markdownIt(options)(input)).toBe(
      '<p><img src="u.jpg" alt="a b c" width="100"></p>'
    );
  });

  it("remark and Sätteri keep them", () => {
    const expected = '<p><img src="u.jpg" alt="a ||b|| c" width="100"></p>';
    expect(remark(options)(input)).toBe(expected);
    expect(satteri(options)(input)).toBe(expected);
  });
});
