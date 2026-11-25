# Markdown Squeeze Paragraphs

Removes empty (whitespace-only) paragraphs in VSCode's markdown preview.

## Overview

The `squeeze-paragraphs` plugin removes paragraphs that are empty or contain only whitespace. A paragraph counts as empty when it has no children, or when every child is whitespace-only text. Whitespace means the characters HTML ignores between elements (space, tab, line feed, form feed and carriage return): a paragraph holding only a no-break space (`&nbsp;`) or another Unicode space is deliberate content and is kept. An empty paragraph is removed even if it carries attributes, such as an `id` or a `class`, and they are dropped with it.

Markdown has one way to write such a paragraph by hand: whitespace written as character references, such as `&#32;` alone between two blank lines, and the plugin removes that too. Otherwise it does nothing to hand-written Markdown. Its job is to run **after** other transforms that can leave an empty `<p>` behind — for example a comment stripper that removes a paragraph's only content, or a plugin that lifts an element out of its wrapping paragraph. Adding `squeeze-paragraphs` last tidies up that residue.

**Before** (a prior transform emptied the middle paragraph):
```html
<p>Kept.</p>
<p></p>
<p>Also kept.</p>
```

**After:**
```html
<p>Kept.</p>
<p>Also kept.</p>
```

## Syntax

There is no syntax and no visible change for normal Markdown — paragraphs with real content are always preserved:

````markdown
A paragraph with text.

A paragraph with *emphasis* and an image ![a swan](./assets/swan-thumb.jpg) is not empty either.
````

[!NOTE]
Apart from a paragraph of whitespace character references (`&#32;`), empty paragraphs cannot be written directly in Markdown, so the removal behaviour mostly shows up when another plugin produces one. Place `squeeze-paragraphs` last in your pipeline so it sees that residue.

Two things differ between the engines:

- With markdown-it's `breaks: true`, a line ending inside a paragraph renders as a `<br>`, so a paragraph of whitespace over several lines (`&#32;` on two lines running) is kept there, and removed without the option. A hard break (two spaces or a backslash before the line ending) keeps the paragraph in every engine.
- In a tight list item there is no `<p>` to remove in remark and Sätteri, so `- &#32;` keeps its space inside the `<li>`, where markdown-it leaves the item empty.

## About

Part of **[Markdown Preview Extended Syntax](https://marketplace.visualstudio.com/items?itemName=saeris.markdown-preview-extended-syntax)** — a pack of Markdown preview syntax extensions you can install all at once.

Powered by [`@mirrordown/mdit-squeeze-paragraphs`](https://www.npmjs.com/package/@mirrordown/mdit-squeeze-paragraphs) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
