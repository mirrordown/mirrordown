# Markdown Delete &lt;del&gt;

Adds HTML Delete &lt;del&gt; support to VSCode's markdown preview.

## Overview

The `del` plugin renders `--text--` as an HTML `<del>` element, representing deleted or struck-through text.

```html
<del>text</del>
```

## Syntax

Wrap text in double dashes to mark it as deleted:

```markdown
--This text has been deleted.--

You can use it inline: the price was --$50-- $35.
```

## About

Part of **[Markdown Preview Extended Syntax](https://marketplace.visualstudio.com/items?itemName=saeris.markdown-preview-extended-syntax)** — a pack of Markdown preview syntax extensions you can install all at once.

Powered by [`@mirrordown/mdit-del`](https://www.npmjs.com/package/@mirrordown/mdit-del) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
