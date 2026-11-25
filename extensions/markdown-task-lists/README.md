# Markdown Task Lists & Obsidian Statuses

Adds task lists and Obsidian's task status markers to VSCode's markdown preview.

## Overview

The `task-lists` plugin renders GitHub's task lists, `- [ ]` to do and `- [x]` done, and six more markers that the community writing Obsidian vaults agrees on. markdown-it gets the same task lists as remark-gfm and Sätteri, byte for byte; remark and Sätteri get the six markers, which GFM leaves as text.

```html
<ul class="contains-task-list">
<li class="task-list-item"><input type="checkbox" disabled> to do</li>
<li class="task-list-item"><input type="checkbox" checked disabled> done</li>
<li class="task-list-item" data-task="/"><input type="checkbox" disabled aria-label="In progress"> in progress</li>
</ul>
```

## Syntax

Start a list item with a box: `[`, one marker, `]`, then a space and the task.

| Marker | Meaning | Box | `data-task` | Label |
| --- | --- | --- | --- | --- |
| space | to do | unchecked | none | none |
| `x`, `X` | done | checked | none | none |
| `/` | in progress | unchecked | `/` | In progress |
| `-` | cancelled | unchecked | `-` | Cancelled |
| `>` | forwarded | unchecked | `>` | Forwarded |
| `<` | scheduled | unchecked | `<` | Scheduled |
| `?` | question | unchecked | `?` | Question |
| `!` | important | unchecked | `!` | Important |

````markdown
- [ ] To do
- [x] Done
- [/] In progress
- [-] Cancelled
- [>] Forwarded
- [<] Scheduled
- [?] Question
- [!] Important
````

A marker says what state a task is in. Only done is checked: a task in progress, cancelled or put off is not finished, and a checked box would tell a reader, and a screen reader, that it is. Each of the six gets `data-task` on its item, the attribute Obsidian's themes style, and an `aria-label` on its box, so a screen reader announces the state rather than an unchecked box.

Any other marker is text, as it is in GFM: `- [b] text`, `- [1] reference` and `- [a] option` keep their brackets, so a list of bracketed references or options is still an ordinary list. The `fallback` option reads every marker instead.

The boxes are `disabled`. The plugin draws a task's state; it does not make tasks interactive, and it adds no script.

### Where a box is read

A box is read where GFM reads one: at the very start of a list item's first paragraph, on the line the item starts on, followed by a space, a tab or a line ending, and then more of the item. Nested lists, ordered lists, loose lists (the box goes in the paragraph) and lists in blockquotes, alerts, tabs and steps all work.

These stay text:

- A box with nothing after it (`- [?]`), or with no space after it (`- [?]text`).
- A box on a later line of the item, in a later paragraph, or in a heading.
- A box written with an escape (`- \[?] text`) or a character reference (`- &#91;?] text`).
- A second box: in `- [x] [?] text`, the task is done and `[?]` is its text.
- A box directly followed by a CRLF line ending, with the text on the next line. Sätteri reads `[x]` there as text, so every engine reads every marker that way; with a space before the line ending, it is a task.

remark-gfm and Sätteri's GFM read `[ ]` and `[x]` themselves, before the plugin runs, and the plugin leaves the items they read alone. In a few corners they read `[x]` differently from each other, and from this plugin: remark-gfm reads a box on the line after an empty list marker (`-` alone on its line) and a box directly followed by CRLF, and Sätteri reads a box that opens a setext heading. The other markers, and `[x]` with GFM off, follow Sätteri.

### Attributes

With the [`attrs`](/guide/plugins/attrs) plugin, or Sätteri's built-in `attributes` feature, a task takes attribute blocks as GFM's do. A block at the end of the task's text goes on its item, and one on the line after the list goes on the list; their classes come before the task's own (`class="urgent task-list-item"`). A `data-task` written in a block replaces the marker's.

````markdown
- [!] Renew the certificate {.urgent #cert}
````

In remark, list `remarkAttrs` after `remarkTaskLists`: before it, the block's class is written as a second `class` attribute beside the task's. In Sätteri, a block that is all an item holds after its box (`- [?] {.urgent}`) leaves the box as text, because Sätteri takes the block off while it parses, before the plugin sees the item.

## Styling

This extension ships default styles for the rendered output in the preview. To
customize them, point VSCode's `markdown.styles` setting at your own CSS file:

```jsonc
// .vscode/settings.json
{
  "markdown.styles": ["./my-preview-styles.css"]
}
```

## About

Part of **[Markdown Preview Extended Syntax](https://marketplace.visualstudio.com/items?itemName=saeris.markdown-preview-extended-syntax)** — a pack of Markdown preview syntax extensions you can install all at once.

Powered by [`@mirrordown/mdit-task-lists`](https://www.npmjs.com/package/@mirrordown/mdit-task-lists) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
