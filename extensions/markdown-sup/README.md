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

The content is inline markup, like emphasis: it can hold spaces, other formatting and subscript, but can't start or end with a space.

````markdown
e^x~0~^ and the ^*n*th power^
````

## About

Part of **[Markdown Preview Extended Syntax](https://marketplace.visualstudio.com/items?itemName=saeris.markdown-preview-extended-syntax)** — a pack of Markdown preview syntax extensions you can install all at once.

Powered by [`@mirrordown/mdit-sup`](https://www.npmjs.com/package/@mirrordown/mdit-sup) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
