# Markdown Squeeze Paragraphs

Removes empty (whitespace-only) paragraphs in VSCode's markdown preview.

## Overview

The `squeeze-paragraphs` plugin removes paragraphs that are empty or contain only whitespace. A paragraph counts as empty when it has no children, or when every child is whitespace-only text.

CommonMark never emits an empty paragraph on its own, so this plugin does nothing to ordinary hand-written Markdown. Its job is to run **after** other transforms that can leave an empty `<p>` behind — for example a comment stripper that removes a paragraph's only content, or a plugin that lifts an element out of its wrapping paragraph. Adding `squeeze-paragraphs` last tidies up that residue.

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

```markdown
A paragraph with text.

A paragraph with _emphasis_ and an image ![icon](https://picsum.photos/16/16) is not empty either.
```

[!NOTE]
Because empty paragraphs cannot be written directly in Markdown, the removal behaviour only shows up when another plugin produces one. Place `squeeze-paragraphs` last in your pipeline so it sees that residue.

## About

Part of **[Markdown Preview Extended Syntax](https://marketplace.visualstudio.com/items?itemName=saeris.markdown-preview-extended-syntax)** — a pack of Markdown preview syntax extensions you can install all at once.

Powered by [`@mirrordown/mdit-squeeze-paragraphs`](https://www.npmjs.com/package/@mirrordown/mdit-squeeze-paragraphs) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
