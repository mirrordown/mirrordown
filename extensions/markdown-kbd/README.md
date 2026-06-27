# Markdown Keyboard &lt;kbd&gt;

Adds HTML Keyboard &lt;kbd&gt; support to VSCode's markdown preview.

## Overview

The `kbd` plugin renders `[[key]]` as an HTML `<kbd>` element, representing keyboard input or a key name.

```html
<kbd>key</kbd>
```

## Syntax

Wrap a key name in double square brackets:

```markdown
Press [[Enter]] to confirm.

You can combine multiple keys: [[Ctrl]] + [[Shift]] + [[P]] opens the command palette.
```

## About

Part of **[Markdown Preview Extended Syntax](https://marketplace.visualstudio.com/items?itemName=saeris.markdown-preview-extended-syntax)** — a pack of Markdown preview syntax extensions you can install all at once.

Powered by [`@mirrordown/mdit-kbd`](https://www.npmjs.com/package/@mirrordown/mdit-kbd) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
