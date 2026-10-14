# @mirrordown/remd-unwrap-images

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A remark/rehype (unified) plugin for the `unwrap-images` syntax extension.

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

[!NOTE]
This is a rehype plugin (`rehype-*`), not a remark plugin. Add it **after** `remarkRehype` in your pipeline.

## Install

```sh
npm install @mirrordown/remd-unwrap-images
```

### Unified

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { rehypeUnwrapImages } from "@mirrordown/remd-unwrap-images";

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeUnwrapImages)
  .use(rehypeStringify);
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { rehypeUnwrapImages } from "@mirrordown/remd-unwrap-images";

export default defineConfig({
  markdown: {
    rehypePlugins: [rehypeUnwrapImages],
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
