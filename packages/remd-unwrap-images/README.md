# @saeris/remd-unwrap-images

> Part of [`@saeris/markdown`](https://github.com/saeris/markdown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A remark/rehype (unified) plugin for the `unwrap-images` syntax extension.

## Overview

The `unwrap-images` plugin removes the `<p>` wrapper that Markdown adds around standalone images, allowing images to render as direct block-level elements. Images inside links are also unwrapped.

**Before:**

```html
<p><img src="photo.jpg" alt="A photo" /></p>
```

**After:**

```html
<img src="photo.jpg" alt="A photo" />
```

## Syntax

Any image that stands alone on a paragraph — with no other text or inline content — is unwrapped:

```markdown
![An example image](https://picsum.photos/400/200)

Images mixed with text are **not** unwrapped:

Here is an inline image: ![icon](https://picsum.photos/16/16) within a sentence.
```

## Usage

[!NOTE]
This is a rehype plugin (`rehype-*`), not a remark plugin. Add it **after** `remarkRehype` in your pipeline.

## Documentation

Full documentation, more examples, and configuration options: [saeris.github.io/markdown/guide/plugins/unwrap-images](https://saeris.github.io/markdown/guide/plugins/unwrap-images)

## License

MIT © [Drake Costa](https://saeris.gg)
