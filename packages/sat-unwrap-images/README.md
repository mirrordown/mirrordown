# @mirrordown/sat-unwrap-images

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A Sätteri plugin for the `unwrap-images` syntax extension.

## Overview

The `unwrap-images` plugin removes the `<p>` wrapper that Markdown adds around standalone images, allowing images to render as direct block-level elements. Images inside links are also unwrapped.

**Before:**
```html
<p><img src="photo.jpg" alt="A photo"></p>
```

**After:**
```html
<img src="photo.jpg" alt="A photo">
```

## Syntax

Any image that stands alone on a paragraph — with no other text or inline content — is unwrapped:

````markdown
![Swan boats moored at a dock](./assets/swan-boats.jpg)

Images mixed with text are **not** unwrapped:

Here is an inline image: ![a swan](./assets/swan-thumb.jpg) within a sentence.
````

A paragraph of several images, with only spaces or line breaks between them, is unwrapped too. So is a [lightbox](/guide/plugins/lightbox) image, whose trigger button takes the paragraph's place.

## Attributes

A paragraph's attributes are not lost with it. When the paragraph holds one image, every attribute the paragraph carries goes on the `<img>`: the id, classes and other attributes an [attrs](/guide/plugins/attrs) block on the line after the image gives it, and the id a [block-ids](/guide/plugins/block-ids) marker gives it. The `<img>` takes them inside a link or a lightbox button too, so a link to the paragraph's id still finds the image.

````markdown
![A swan](./assets/swan-thumb.jpg)
{#swan}

![A swan named by a marker](./assets/swan-thumb.jpg) ^swan

[Jump to the first swan](#swan), or [to the second](#^swan).
````

```html
<img src="./assets/swan-thumb.jpg" alt="A swan" id="swan">
<img src="./assets/swan-thumb.jpg" alt="A swan named by a marker" id="^swan">
<p><a href="#swan">Jump to the first swan</a>, or <a href="#%5Eswan">to the second</a>.</p>
```

The image's own attributes win: an id written on the image (`![…](…){#own}`) stays and the paragraph's is dropped, and the same goes for any other attribute both have. Classes add up, the image's own first and each once: `![a](pic.png){.c}` with `{.wide}` on the next line renders `class="c wide"`. The paragraph's other attributes follow the image's own, in the order they were written.

A paragraph that carries an attribute and holds several images is not unwrapped: an id can name only one element, and a class on a group of images, such as `{.gallery}`, is about the group. It renders as it would without this plugin, `<p class="gallery"><img …> <img …></p>`. Several images in a paragraph with no attribute are unwrapped as before.

> [!NOTE]
> The remark package ships a rehype plugin, not a remark plugin: add it **after** `remarkRehype` in your pipeline. In every engine, list the lightbox plugin before this one if you use both: listed after it, a lightbox image keeps its paragraph.

## Install

```sh
npm install @mirrordown/sat-unwrap-images
```

### Standalone

```ts
import { markdownToHtml } from "satteri";
import { satteriUnwrapImages } from "@mirrordown/sat-unwrap-images";

const { html } = markdownToHtml(source, {
  hastPlugins: [satteriUnwrapImages()],
});
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import { satteriUnwrapImages } from "@mirrordown/sat-unwrap-images";

export default defineConfig({
  markdown: {
    processor: satteri({ hastPlugins: [satteriUnwrapImages()] }),
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
