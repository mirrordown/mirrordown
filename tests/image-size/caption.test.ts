import { describe, expect, it } from "vite-plus/test";
import { engines } from "../presets/engines.js";
import { lightboxId } from "../../packages/core/src";
import { only } from "./presets.js";

const id = lightboxId("e.jpg");

describe.each(engines)("image-size + caption (%s)", (_engine, render) => {
  const html = render(only(`imageSize`, `caption`));

  it("captions a sized image", () => {
    expect(html("![Engelbart|100x145](e.jpg)\n~: A portrait")).toBe(
      '<figure class="markdown-caption"><img src="e.jpg" alt="Engelbart" width="100" height="145"><figcaption>A portrait</figcaption></figure>'
    );
  });

  it("sizes an image inside the caption", () => {
    expect(html("![a](a.jpg)\n~: Next to ![b|20](b.jpg)")).toBe(
      '<figure class="markdown-caption"><img src="a.jpg" alt="a"><figcaption>Next to <img src="b.jpg" alt="b" width="20"></figcaption></figure>'
    );
  });

  it("captions a sized lightbox image", () => {
    const withLightbox = render(only(`imageSize`, `caption`, `lightbox`));
    const img = '<img src="e.jpg" alt="Engelbart" width="100">';
    expect(withLightbox("!![Engelbart|100](e.jpg)\n~: A portrait")).toBe(
      `<figure class="markdown-caption"><button type="button" class="markdown-lightbox-trigger" command="show-modal" commandfor="${id}">${img}</button><figcaption>A portrait</figcaption></figure><dialog id="${id}" class="markdown-lightbox" closedby="any"><button type="button" class="markdown-lightbox-close" command="close" commandfor="${id}" aria-label="Close image"><img src="e.jpg" alt="Engelbart"></button></dialog>`
    );
  });
});
