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

Words inside the braces are separated by spaces or tabs. A value that holds spaces is quoted, with `"` or `'`, as in `{title="A longer title"}`. A word of two or more characters with no `=` is an attribute with an empty value, as in `{hidden}`, and a lone character is ignored. Setting an attribute the element already has replaces its value. Classes add up.

Braces that set nothing stay text: `{}`, `{ }`, `{x}` and `{a, b}` are left alone. So is a block with a quote that never closes, with a key that isn't a name (`{a/b=c}`), or written across two lines, or one that holds a character reference (`{title="a&amp;b"}`), except on a code fence, where the reference is decoded. To keep a block that would be read as text, escape its opening brace: `\{.note}`.

### Headings

````markdown
## My Section {#my-section .highlight}
````

### Code fences

````markdown
```ts {.language-typescript data-filename="example.ts"}
const x = 1;
```
````

### Paragraphs

````markdown
A paragraph with a custom class.
{.note}
````

With [unwrap-images](/guide/plugins/unwrap-images), a block on the line after an image that stands alone in its paragraph goes on the `<img>` when the paragraph is unwrapped, and a paragraph of several images keeps its block and is not unwrapped.

### Inline elements

````markdown
This is **important**{.warning} text.
````

### After lists and tables

````markdown
- Item one
- Item two
{.checklist}
````

A table takes its block after a blank line, since a line written straight under a table is another row of it. A list takes one there too.

````markdown
| Name | Value |
| ---- | ----- |
| a    | 1     |

{.data}
````

### Inside blockquotes and lists

A block on a line of its own goes on the block it's written after, at the level its `>` markers and indentation put it, as kramdown places a block IAL. Written inside a blockquote or list item, it goes on the paragraph, or on the item in a tight list. Written outside one, as a lazy continuation line, it goes on that blockquote, or on the item's list.

````markdown
> A quoted paragraph.
> {.note}

> A quoted paragraph.
{.callout}

- Item one
  {.first}
- Item two
````

markdown-it-attrs can't see a line's indentation, so it gives such a line to the outermost block that ends with the paragraph instead.

## About

Part of **[Markdown Preview Extended Syntax](https://marketplace.visualstudio.com/items?itemName=saeris.markdown-preview-extended-syntax)** — a pack of Markdown preview syntax extensions you can install all at once.

Powered by [`@mirrordown/mdit-attrs`](https://www.npmjs.com/package/@mirrordown/mdit-attrs) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
