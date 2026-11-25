# Markdown Superscript &lt;sup&gt;

Adds HTML Superscript &lt;sup&gt; support to VSCode's markdown preview.

## Overview

The `sup` plugin renders `^text^` as an HTML `<sup>` element, representing superscript text.

```html
<sup>text</sup>
```

## Syntax

Wrap text in single carets to render it as superscript:

````markdown
E = mc^2^

The Pythagorean theorem: a^2^ + b^2^ = c^2^
````

### Formatting inside

The content is inline markup, like emphasis: it can hold spaces, other formatting and subscript, but can't start or end with a space. As with emphasis, a caret between a letter or digit and punctuation doesn't open or close one, so `10^-3^` and `x^(2)^` stay as written; after a space it does (`x ^-1^`).

````markdown
e^x~0~^ and the ^*n*th power^
````

A backslash keeps a caret literal (`x\^2\^`). A caret right after `[` opens a superscript like any other, so a footnote-style reference with no definition (`[^1] x^2^`) pairs with the next closing caret. A few things differ between the engines:

- Spans have to nest. When a superscript crosses a span another plugin builds (`==a ^b== c^`), each engine resolves it its own way. Crossing emphasis (`^a *b^ c*`) renders the same in all three.
- A run of two or more carets is plain text in markdown-it and remark. Sätteri pairs two runs of the same length, so `^^a^^` is a superscript there.
- Sätteri's superscript takes no attribute block: `x^2^{.s} y` sets the class with the markdown-it and remark attrs plugins and keeps the braces as text on Sätteri, where a block at the end of a paragraph, heading or list item sets the class on that element instead.

## About

Part of **[Markdown Preview Extended Syntax](https://marketplace.visualstudio.com/items?itemName=saeris.markdown-preview-extended-syntax)** — a pack of Markdown preview syntax extensions you can install all at once.

Powered by [`@mirrordown/mdit-sup`](https://www.npmjs.com/package/@mirrordown/mdit-sup) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
