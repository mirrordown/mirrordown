# Markdown Unwrap Images

Unwraps block-level images from paragraph wrappers in VSCode's markdown preview.

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

## About

Part of **[Markdown Preview Extended Syntax](https://marketplace.visualstudio.com/items?itemName=saeris.markdown-preview-extended-syntax)** — a pack of Markdown preview syntax extensions you can install all at once.

Powered by [`@mirrordown/mdit-unwrap-images`](https://www.npmjs.com/package/@mirrordown/mdit-unwrap-images) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
