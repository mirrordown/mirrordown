# @mirrordown/mdit-unwrap-images

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A markdown-it plugin for the `unwrap-images` syntax extension.

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
![An example image](https://picsum.photos/400/200)

Images mixed with text are **not** unwrapped:

Here is an inline image: ![icon](https://picsum.photos/16/16) within a sentence.
````

A paragraph of several images, with only spaces or line breaks between them, is unwrapped too. So is a [lightbox](/guide/plugins/lightbox) image, whose trigger button takes the paragraph's place.

The paragraph's own attributes go with it. With the [`attrs`](/guide/plugins/attrs) plugin, a block on the line after the image (`{.wide}`) belongs to the paragraph and is dropped; write it on the image instead (`![…](…){.wide}`).

> [!NOTE]
> The remark package ships a rehype plugin, not a remark plugin: add it **after** `remarkRehype` in your pipeline. In every engine, list the lightbox plugin before this one if you use both: listed after it, a lightbox image keeps its paragraph.

## Install

```sh
npm install @mirrordown/mdit-unwrap-images
```

### Standalone

```ts
import MarkdownIt from "markdown-it";
import { unwrapImages } from "@mirrordown/mdit-unwrap-images";

const md = new MarkdownIt().use(unwrapImages);
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { unwrapImages } from "@mirrordown/mdit-unwrap-images";

export default defineConfig({
  markdown: {
    config: (md) => md.use(unwrapImages),
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
