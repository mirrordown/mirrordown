# Markdown Unwrap Images

Unwraps block-level images from paragraph wrappers in VSCode's markdown preview.

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

## About

Part of **[Markdown Preview Extended Syntax](https://marketplace.visualstudio.com/items?itemName=saeris.markdown-preview-extended-syntax)** — a pack of Markdown preview syntax extensions you can install all at once.

Powered by [`@mirrordown/mdit-unwrap-images`](https://www.npmjs.com/package/@mirrordown/mdit-unwrap-images) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
