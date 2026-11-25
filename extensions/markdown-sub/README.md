# Markdown Subscript

Adds HTML Subscript &lt;sub&gt; support to VSCode's markdown preview.

## Overview

The `sub` plugin renders `~text~` as an HTML `<sub>` element, representing subscript text.

```html
<sub>text</sub>
```

## Syntax

Wrap text in single tildes to render it as subscript:

````markdown
The chemical formula for water is H~2~O.

Carbon dioxide is CO~2~.
````

### Formatting inside

The content is inline markup, like emphasis: it can hold spaces, other formatting and superscript, but can't start or end with a space. As with emphasis, a tilde between a letter or digit and punctuation doesn't open or close one, so `10~-3~` and `H~(2)~O` stay as written; after a space it does (`x ~-1~`).

````markdown
x~n^2^~ and the ~*base* index~
````

A backslash keeps a tilde literal (`H\~2\~O`). Asterisks wrapped tightly around a subscript inside a word (`H**~2~**O`) are emphasis only with GFM, which lets emphasis sit against a `~`; in markdown-it that is the `strikethrough` rule, on by default. A few things differ between the engines:

- Spans have to nest. When a subscript crosses a span another plugin builds (`==a ~b== c~`, `--a ~b-- c~`), each engine resolves it its own way. Crossing emphasis (`~a *b~ c*`) renders the same in all three.
- With GFM off, Sätteri still reads `~~…~~` as a pair and finds no subscript inside it (`~~H~2~O~~`). markdown-it and remark do.
- Sätteri's subscript takes no attribute block: `x~2~{.s}` sets the class with the markdown-it and remark attrs plugins and keeps the braces as text on Sätteri, where a block at the end of a paragraph, heading or list item (`x~2~{.s}` alone on a line) sets the class on that element instead.

## About

Part of **[Markdown Preview Extended Syntax](https://marketplace.visualstudio.com/items?itemName=saeris.markdown-preview-extended-syntax)** — a pack of Markdown preview syntax extensions you can install all at once.

Powered by [`@mirrordown/mdit-sub`](https://www.npmjs.com/package/@mirrordown/mdit-sub) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
