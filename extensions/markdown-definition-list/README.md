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

````markdown
Apple
: A round fruit with red or green skin.
: Also a technology company.

Orange
: A citrus fruit with orange skin.
````

A term fits on one line: a marker after a paragraph of two or more lines continues that paragraph instead of starting a list, as in Pandoc.

Each definition is tight or loose on its own. A definition is loose, and wraps its content in `<p>`, when a blank line comes directly before its marker or separates blocks inside it. Otherwise its paragraphs render unwrapped. A marker with nothing after it produces an empty `<dd>`.

### Styling

The plugin ships no stylesheet: `<dl>`, `<dt>` and `<dd>` get the browser's defaults, which indent each definition and leave its term plain. The examples in the Mirrordown docs use the docs' own styles, which bold the term and set each definition off with a rule:

```css
dt {
  font-weight: 600;
}

dd {
  margin-inline-start: 0.25rem;
  padding-inline-start: 1rem;
  border-inline-start: 2px solid #e5e7eb;
}
```

## About

Part of **[Markdown Preview Extended Syntax](https://marketplace.visualstudio.com/items?itemName=saeris.markdown-preview-extended-syntax)** — a pack of Markdown preview syntax extensions you can install all at once.

Powered by [`@mirrordown/mdit-definition-list`](https://www.npmjs.com/package/@mirrordown/mdit-definition-list) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
