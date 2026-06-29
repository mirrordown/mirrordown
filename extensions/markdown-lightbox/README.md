# Markdown Image Lightbox

Adds a JavaScript-free click-to-zoom image lightbox to VSCode's markdown preview.

## Overview

Opt an image into a lightbox with a leading `!!`. The marked image becomes a
trigger that opens the full-size image in a modal `<dialog>`, dimming and
blurring the page behind it. Unmarked images (`![…]`) render normally.

The entire interaction — open, close, backdrop dismiss, `Esc`, focus trapping,
and the zoom/fade animation — is built from modern declarative HTML and CSS only
(`<dialog>`, the Invoker Commands API, `closedby="any"`, `@starting-style`). No
JavaScript runs in the preview, so it works where scripts are disabled.

## Syntax

Add a second `!` in front of any image:

```markdown
!![A wild rice field](./wild-rice.jpg "Wild rice")
```

Click the image to zoom; click it again, click the backdrop, or press `Esc` to
close.

### Repeated images

Reference the same image more than once and every trigger opens the **same**
dialog — there's one lightbox per image, not one per mention:

```markdown
!![Diagram](./diagram.png) … later … !![Diagram again](./diagram.png)
```

### Naming a lightbox

With the [Markdown Attributes](https://marketplace.visualstudio.com/items?itemName=saeris.markdown-attributes)
extension installed, give a lightbox a stable id with `{#id}`:

```markdown
!![Hero shot](./hero.jpg){#hero}
```

### Images inside links

An image wrapped in a link is left alone — a button can't nest in a link, so the
link wins and the `!` stays literal:

```markdown
[!![Thumbnail](./thumb.jpg)](https://example.com)
```

## Styling

This extension ships default styles for the preview. Tune them with public
custom properties, or override the structure entirely, by pointing VSCode's
`markdown.styles` setting at your own CSS file:

```jsonc
// .vscode/settings.json
{
  "markdown.styles": ["./my-preview-styles.css"]
}
```

```css
/* my-preview-styles.css */
:root {
  --markdown-lightbox-backdrop: rgb(0 0 0 / 85%);
  --markdown-lightbox-blur: 6px;
  --markdown-lightbox-radius: 0.5rem;
  --markdown-lightbox-duration: 0.2s;
}
```

## About

Part of **[Markdown Preview Extended Syntax](https://marketplace.visualstudio.com/items?itemName=saeris.markdown-preview-extended-syntax)** — a pack of Markdown preview syntax extensions you can install all at once.

Powered by [`@mirrordown/mdit-lightbox`](https://www.npmjs.com/package/@mirrordown/mdit-lightbox) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
