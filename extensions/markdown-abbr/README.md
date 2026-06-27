# Markdown Abbreviation &lt;abbr&gt;

Adds HTML Abbreviation &lt;abbr&gt; support to VSCode's markdown preview.

## Overview

The `abbr` plugin lets you define abbreviations once and automatically wraps every occurrence in an `<abbr>` element with a `title` attribute for the full expansion.

```html
<abbr title="HyperText Markup Language">HTML</abbr>
```

## Syntax

Define abbreviations anywhere in the document using the `*[ABBR]: Full text` syntax. Definitions are removed from the output and all matching words are wrapped automatically.

```markdown
_[HTML]: HyperText Markup Language
_[CSS]: Cascading Style Sheets

Write HTML and CSS as normal — they are automatically expanded with tooltips.
```

## About

Part of **[Markdown Preview Extended Syntax](https://marketplace.visualstudio.com/items?itemName=saeris.markdown-preview-extended-syntax)** — a pack of Markdown preview syntax extensions you can install all at once.

Powered by [`@mirrordown/mdit-abbr`](https://www.npmjs.com/package/@mirrordown/mdit-abbr) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
