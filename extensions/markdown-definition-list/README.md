# Markdown Definition List &lt;dl&gt;

Adds HTML Definition List &lt;dl&gt; support to VSCode's markdown preview.

## Overview

The `definition-list` plugin renders Pandoc-style definition lists as HTML `<dl>`, `<dt>`, and `<dd>` elements.

```html
<dl>
  <dt>Term</dt>
  <dd>Definition</dd>
</dl>
```

## Syntax

Write a term on one line, then follow it with one or more definitions prefixed by `: ` or `~ `:

```markdown
Apple
: A round fruit with red or green skin.
: Also a technology company.

Orange
: A citrus fruit with orange skin.

Multiple terms can share definitions:

HTTP
HTTPS
: Protocols for transferring data on the web.
```

## About

Part of **[Markdown Preview Extended Syntax](https://marketplace.visualstudio.com/items?itemName=saeris.markdown-preview-extended-syntax)** — a pack of Markdown preview syntax extensions you can install all at once.

Powered by [`@mirrordown/mdit-definition-list`](https://www.npmjs.com/package/@mirrordown/mdit-definition-list) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
