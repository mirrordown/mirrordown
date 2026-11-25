# Markdown GitHub Alerts & Obsidian Callouts

Adds GitHub Alert and Obsidian Callout syntax support to VSCode's markdown preview.

## Overview

The `github-alerts` plugin converts GitHub-style alert blockquotes (`> [!NOTE]`, `> [!WARNING]`, etc.) and Obsidian callouts of any type (`> [!custom-type]`) into styled `<div>` containers with an icon and title. Foldable alerts are rendered as `<details>` elements.

```html
<div class="markdown-alert" data-alert="note">
  <p class="markdown-alert-title">Note</p>
  <p>...</p>
</div>
```

## Syntax

Write a blockquote with a `[!TYPE]` marker on the first line:

````markdown
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
````

The keyword is read in any case (`[!note]` is a note), without the spaces around it, and with each run of spaces inside it as a `-`, as Obsidian reads it: `[! NOTE ]` is a note, and `[!My type]` is the type `my-type`. A keyword can name any type, not only the built-in ones: see [undefined types](#undefined-types). A backslash before the marker (`> \[!NOTE]`) leaves the quote a quote, with the marker as text.

### Custom titles

Override the default title by adding a space and text after the type marker. Text written straight against the marker (`> [!NOTE]Title`, `> [!NOTE]-Title`) leaves the quote a quote, as it does in Obsidian and on GitHub. Everything after the marker on that line is the title, and it can use inline formatting; the body starts on the next line. Emphasis, a code span or a link that opens in the title and closes on a later line takes the title with it, to the end of the line it closes on:

````markdown
> [!NOTE] Custom *Title*
> This alert uses a custom title instead of the default.
````

### Foldable alerts

Use `+` to make an alert open by default, or `-` to make it collapsed by default:

````markdown
> [!TIP]+
> This tip is open by default.

> [!WARNING]-
> This warning is collapsed by default.
````

### Metadata

Text after a `|` in the marker is the alert's metadata, as in Obsidian. It goes on the container as `data-alert-metadata`, without the spaces around it, for a stylesheet to read; empty metadata (`[!info|]`) adds nothing. It works with every type, and with folding:

````markdown
> [!info|wide]+ Metadata
> This alert carries `data-alert-metadata="wide"`.
````

```html
<details class="markdown-alert" data-alert="info" data-alert-metadata="wide" open>
```

The stylesheet gives metadata no meaning of its own: style it with a selector such as `[data-alert-metadata~="wide"]`. The marker's text is read as written, so an escaped character or a character reference anywhere between its brackets (`[!info|a &amp; b]`) leaves the quote a quote.

### Attributes

With the [`attrs`](/guide/plugins/attrs) plugin, or Sätteri's built-in `attributes` feature, an alert takes attribute blocks the way a blockquote does. A block on a line after the alert, written without the `>`, goes on the alert. Written with the `>`, it goes on the body's last paragraph. A block touching an inline element in the title goes on that element and is left out of the title's label.

````markdown
[!NOTE] An *important*{.loud} note
The body.
{#setup-note .wide}
````

List the attrs plugin after the alerts plugin. The engines differ in three places:

- A block after a blank line (`> [!NOTE]`, the body, a blank line, then `{#setup-note}`) goes on the alert in markdown-it and remark. Sätteri reads that line as an empty paragraph of its own, so use the form above there.
- A block that ends the title line, as in `> [!NOTE] Title {.wide}`, goes on the title in markdown-it and is printed as text in remark and Sätteri. Put the block on its own line instead.
- An alert with no body takes a block from the next line only on Sätteri. In markdown-it and remark, `> [!NOTE]` followed by `{.wide}` leaves an empty paragraph inside the alert.

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
