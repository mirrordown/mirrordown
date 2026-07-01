# Markdown Heading Anchors

Adds shareable anchor links to headings in VSCode's markdown preview.

## Overview

The `autolink-headings` plugin adds a self-referential link to every heading that has an `id`, turning each heading into a shareable anchor. Pair it with [`slug`](/guide/plugins/slug) (or [`attrs`](/guide/plugins/attrs)) so the headings have ids to link to.

**Before:**

```html
<h2 id="getting-started">Getting Started</h2>
```

**After:**

```html
<h2 id="getting-started">
  <a class="anchor" aria-hidden="true" tabindex="-1" href="#getting-started"></a
  >Getting Started
</h2>
```

By default the link is **empty** and carries `class="anchor"`. The shipped stylesheet draws a `#` marker via a CSS `::before` pseudo-element that fades in on hover — so no extra element is emitted, and there is no JavaScript involved.

## Syntax

There is no special syntax — just write headings. Hover one to reveal its link:

```markdown
### Hover Over This Heading

### And This One Too
```

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

Powered by [`@mirrordown/mdit-autolink-headings`](https://www.npmjs.com/package/@mirrordown/mdit-autolink-headings) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
