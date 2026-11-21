import { describe, expect, it } from "vite-plus/test";
import { engines } from "../presets/engines.js";

// Where each preset lists image-size decides what it reaches and what reads it. Each case fails in the engine whose preset lists it in the wrong place: before the plugins that make image nodes (a prompt's preview, a ruby's reading), after the alerts plugin that reads an alt into a title's label, or, in markdown-it, after attrs.
describe.each(engines)("image-size in the %s preset", (_engine, render) => {
  const html = render({ githubAlerts: { icons: false } });

  it("sizes an image in a prompt's preview", () => {
    const prompt = html("```prompt open\n![b|100](u.jpg)\n```");
    expect(prompt).toContain('<img src="u.jpg" alt="b" width="100">');
    expect(prompt).not.toContain('alt="b|100"');
  });

  it("sizes an image in a ruby's reading", () => {
    expect(html("{a|![b|100](u.jpg)} x")).toBe(
      '<p><ruby>a<rt><img src="u.jpg" alt="b" width="100"></rt></ruby> x</p>'
    );
  });

  // The title holds text as well: a title of only an image is unwrapped by unwrap-images in remark and Sätteri, and not in markdown-it, whatever its size.
  it("labels an alert's title with the alt without the size", () => {
    expect(html("> [!NOTE] See ![b|100](u.jpg)\n> body")).toBe(
      '<div class="markdown-alert" data-alert="note"><p class="markdown-alert-title" aria-label="See b">See <img src="u.jpg" alt="b" width="100"></p><p>body</p></div>'
    );
  });

  it("writes a title from an attribute block after the size", () => {
    expect(html("![a|100](u.jpg){title=x .wide}")).toBe(
      '<img src="u.jpg" alt="a" width="100" title="x" class="wide">'
    );
  });
});
