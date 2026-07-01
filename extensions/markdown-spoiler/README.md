# Markdown Spoiler

Adds Discord-style ||spoiler|| click-to-reveal text and images to VSCode's markdown preview.

## Overview

The `spoiler` plugin hides content behind a click-to-reveal cover using Discord's `||…||` syntax. Wrap inline content in double pipes — `||the butler did it||` — and it renders as an obscured bar; click it (or focus it and press <kbd>Space</kbd>) to reveal the text in place. Wrap an image and it renders blurred with a centered **SPOILER** label, like Discord's image spoilers.

The entire interaction is built from HTML and CSS only — a `<label>` wrapping a visually-hidden checkbox and the content, revealed with the `:checked` sibling selector. **No JavaScript runs**, so it works in environments that disable scripts, such as the VSCode Markdown preview.

```html
<label class="markdown-spoiler">
  <input type="checkbox" class="markdown-spoiler-toggle" aria-label="spoiler" />
  <span class="markdown-spoiler-content">the butler did it</span>
</label>
```

The checkbox is the only interactive control, so it stays keyboard-operable and is announced by screen readers as a spoiler control — the hidden text is not read aloud until the reader chooses to reveal it.

## Syntax

Wrap any inline content in `||…||`. Click a bar below to reveal it; click again to hide it.

```markdown
The killer was ||the butler|| all along, hidden in ||the conservatory||.
```

In renderers without the plugin, `||…||` renders as plain text.

### Rich inline content

A spoiler can wrap any inline markup — emphasis, code, links — and it stays obscured until revealed. A long spoiler wraps across lines with each line getting its own bar, just like Discord.

```markdown
The recipe needs ||**two** cups of `flour` and a
[secret ingredient](https://example.com) that nobody expects||.
```

### Image spoilers

Wrap an image to hide it behind a blur and a **SPOILER** label — Discord's treatment for spoilered image embeds. Clicking reveals the sharp image.

```markdown
Careful, dinner photo incoming: ||![A young sapling](./assets/sapling.jpg "Sapling")||
```

### Spoilered, zoomable images

Combine with the [`lightbox`](/guide/plugins/lightbox) plugin (`||!![…]()||`) for a spoilered image that is also click-to-zoom once revealed.

```markdown
The reveal: ||!![Mount Fuji at dawn](./assets/fuji.jpg "Mount Fuji")||
```

### Inside links

A spoiler works inside a link — the whole revealed content remains the link target.

```markdown
Read [the ||shocking twist||](https://example.com) at your own risk.
```

## Accessibility

The spoiler is a real checkbox with `aria-label="spoiler"`, so assistive technology announces it as a control the user can operate rather than reading the hidden text aloud. Keyboard users <kbd>Tab</kbd> to the spoiler and press <kbd>Space</kbd> to reveal it; a focus ring marks the current spoiler. Revealing is reversible (unlike Discord, which locks open) — a superset of the expected behavior.

## Customization

The stylesheet keeps its rules in `@layer markdown-spoiler`, so any unlayered CSS you write overrides them without `!important`. The common knobs are exposed as custom properties — set them on `:root` or any ancestor:

| Property                        | Default                                  | Description                         |
| ------------------------------- | ---------------------------------------- | ----------------------------------- |
| `--markdown-spoiler-bar`        | `#202225`                                | Obscured bar color (text spoilers). |
| `--markdown-spoiler-radius`     | `0.25rem`                                | Bar corner radius.                  |
| `--markdown-spoiler-duration`   | `0.15s`                                  | Reveal transition duration.         |
| `--markdown-spoiler-revealed`   | `color-mix(in srgb, currentColor 8%, …)` | Background behind revealed text.    |
| `--markdown-spoiler-media-blur` | `2.5rem`                                 | Blur radius for image spoilers.     |
| `--markdown-spoiler-label`      | `"SPOILER"`                              | Text of the image-spoiler pill.     |

```css
:root {
  --markdown-spoiler-bar: #111;
  --markdown-spoiler-radius: 0.5rem;
  --markdown-spoiler-label: "HIDDEN";
}
```

## Browser support

Text spoilers work everywhere (checkbox + sibling selector). Image spoilers use [`:has()`](https://developer.mozilla.org/docs/Web/CSS/:has) to detect media and [`box-decoration-break`](https://developer.mozilla.org/docs/Web/CSS/box-decoration-break) for per-line bars (Chromium 105+, Safari, Firefox 122+); where unsupported, an image spoiler still hides its content, just without the per-line polish.

## Styling

This extension ships default styles for the rendered output in the preview. To
customize them, point VSCode's `markdown.styles` setting at your own CSS file:

```jsonc
// .vscode/settings.json
{
  "markdown.styles": ["./my-preview-styles.css"]
}
```

## About

Part of **[Markdown Preview Extended Syntax](https://marketplace.visualstudio.com/items?itemName=saeris.markdown-preview-extended-syntax)** — a pack of Markdown preview syntax extensions you can install all at once.

Powered by [`@mirrordown/mdit-spoiler`](https://www.npmjs.com/package/@mirrordown/mdit-spoiler) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
