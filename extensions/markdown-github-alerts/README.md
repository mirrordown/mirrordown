# Markdown GitHub Alerts & Obsidian Callouts

Adds GitHub Alert and Obsidian Callout syntax support to VSCode's markdown preview.

## Overview

The `github-alerts` plugin converts GitHub-style alert blockquotes (`> [!NOTE]`, `> [!WARNING]`, etc.) into styled `<div>` containers with an icon and title. Foldable alerts are rendered as `<details>` elements.

```html
<div class="markdown-alert" data-alert="note">
  <p class="markdown-alert-title">Note</p>
  <p>...</p>
</div>
```

## Syntax

Write a blockquote with a `[!TYPE]` marker on the first line:

```markdown
> [!NOTE]
> Useful information that users should know, even if skimming.

> [!TIP]
> Helpful advice for getting things done more effectively.

> [!IMPORTANT]
> Key information users need to know to achieve their goal.

> [!WARNING]
> Urgent info that needs immediate user attention to avoid problems.

> [!CAUTION]
> Advises about risks or negative outcomes of certain actions.
```

### Custom titles

Override the default title by adding text after the type marker:

```markdown
> [!NOTE] Custom Title
> This alert uses a custom title instead of the default.
```

### Foldable alerts

Use `+` to make an alert open by default, or `-` to make it collapsed by default:

```markdown
> [!TIP]+
> This tip is open by default.

> [!WARNING]-
> This warning is collapsed by default.
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

Powered by [`@mirrordown/mdit-github-alerts`](https://www.npmjs.com/package/@mirrordown/mdit-github-alerts) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
