---
"@mirrordown/mdit-lightbox": patch
"@mirrordown/remd-lightbox": patch
"@mirrordown/sat-lightbox": patch
---

The dialog shows the image at full size whatever size it has on the page.

- **A `width` or `height` on a lightbox image is left off the dialog's copy** (all engines), whether an attribute block gave it or the image-size plugin read it from the description.

  ```markdown
  !![A photo](photo.jpg){width=120}
  ```

  Was `<img src="photo.jpg" alt="A photo" width="120">` in the trigger and in the dialog. Now the trigger keeps `width="120"` and the dialog's image has none. The stylesheet already showed the dialog's image at its natural size, so a page looks the same; the difference is for a host that resizes images from these attributes, such as Astro's image pipeline, which would have made the full-size view as small as the thumbnail.
