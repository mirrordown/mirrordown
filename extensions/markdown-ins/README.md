# Markdown Insert &lt;ins&gt;

Adds HTML Insert &lt;ins&gt; support to VSCode's markdown preview.

## Overview

The `ins` plugin renders `++text++` as an HTML `<ins>` element, representing inserted or added text.

```html
<ins>text</ins>
```

## Syntax

Wrap text in double plus signs to mark it as inserted:

```markdown
++This text has been inserted.++

You can use it inline: the price is now ++$35++ (was $50).
```

## About

Part of **[Markdown Preview Extended Syntax](https://marketplace.visualstudio.com/items?itemName=saeris.markdown-preview-extended-syntax)** — a pack of Markdown preview syntax extensions you can install all at once.

Powered by [`@mirrordown/mdit-ins`](https://www.npmjs.com/package/@mirrordown/mdit-ins) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
