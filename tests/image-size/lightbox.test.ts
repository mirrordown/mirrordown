import { describe, expect, it } from "vite-plus/test";
import { engines } from "../presets/engines.js";
import { lightboxId } from "../../packages/core/src";
import { only } from "./presets.js";

const id = lightboxId("u.jpg");

const trigger = (target: string, img: string) =>
  `<button type="button" class="markdown-lightbox-trigger" command="show-modal" commandfor="${target}">${img}</button>`;
const dialog = (target: string, img: string) =>
  `<dialog id="${target}" class="markdown-lightbox" closedby="any"><button type="button" class="markdown-lightbox-close" command="close" commandfor="${target}" aria-label="Close image">${img}</button></dialog>`;

// The lightbox shows the image twice: on the page, as the trigger's thumbnail, and in the dialog, at full size. The size the author wrote is for the page. If the dialog's image carried it too, a host that resizes images from `width` and `height` (Astro's image pipeline) would shrink the full-size view to the thumbnail's.
describe.each(engines)("image-size + lightbox (%s)", (_engine, render) => {
  const html = render(only(`imageSize`, `lightbox`));

  it("sizes the trigger's image and leaves the dialog's at full size", () => {
    expect(html("Look: !![a|100x145](u.jpg)")).toBe(
      `<p>Look: ${trigger(id, '<img src="u.jpg" alt="a" width="100" height="145">')}</p>${dialog(id, '<img src="u.jpg" alt="a">')}`
    );
  });

  it("keeps the alt without the size, and the title, on both", () => {
    expect(html('Look: !![a|100](u.jpg "T")')).toBe(
      `<p>Look: ${trigger(id, '<img src="u.jpg" alt="a" title="T" width="100">')}</p>${dialog(id, '<img src="u.jpg" alt="a" title="T">')}`
    );
  });

  // The dialog's id is the src's, and the size is not part of the src: two sizes of one image share a dialog, which shows the first image's alt.
  it("shares one dialog between two sizes of one image", () => {
    const small = '<img src="u.jpg" alt="a" width="100">';
    const large = '<img src="u.jpg" alt="b" width="400">';
    expect(html("!![a|100](u.jpg) and !![b|400](u.jpg)")).toBe(
      `<p>${trigger(id, small)} and ${trigger(id, large)}</p>${dialog(id, '<img src="u.jpg" alt="a">')}`
    );
  });
});

describe.each(engines)(
  "image-size + lightbox + unwrap-images (%s)",
  (_engine, render) => {
    it("unwraps a sized lightbox image", () => {
      expect(
        render(only(`imageSize`, `lightbox`, `unwrapImages`))(
          "!![a|100](u.jpg)"
        )
      ).toBe(
        `${trigger(id, '<img src="u.jpg" alt="a" width="100">')}${dialog(id, '<img src="u.jpg" alt="a">')}`
      );
    });
  }
);
