# Markdown Attrs

Adds curly-brace attribute syntax to VSCode's markdown preview.

## Overview

The `attrs` plugin lets you attach HTML attributes (classes, IDs, data attributes, etc.) to almost any Markdown element using `{...}` syntax. It supports headings, paragraphs, code fences, inline elements, lists, tables, and horizontal rules.

```html
<h2 id="my-section" class="highlight">My Section</h2>
```

## Syntax

Attributes are written in curly braces using CSS-like shorthand:

- `#id` → sets `id`
- `.class` → adds a class
- `key=value` → sets any attribute

### Headings

```markdown
## My Section {#my-section .highlight}
```

### Code fences

````markdown
```ts {.language-typescript data-filename="example.ts"}
const x = 1;
```
````

### Paragraphs

```markdown
A paragraph with a custom class.
{.note}
```

### Inline elements

```markdown
This is **important**{.warning} text.
```

### After lists and tables

```markdown
- Item one
- Item two
  {.checklist}
```

## About

Part of **[Markdown Preview Extended Syntax](https://marketplace.visualstudio.com/items?itemName=saeris.markdown-preview-extended-syntax)** — a pack of Markdown preview syntax extensions you can install all at once.

Powered by [`@mirrordown/mdit-attrs`](https://www.npmjs.com/package/@mirrordown/mdit-attrs) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
