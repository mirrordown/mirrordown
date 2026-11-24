# @mirrordown/sat-task-lists

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A Sätteri plugin for the `task-lists` syntax extension.

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

## Configuration

All options are passed when registering the plugin.

### Add, relabel or remove markers

`markers` maps a marker to its label, the box's accessible name. A string adds a marker or relabels one of the six, which is also how the labels are translated; `false` removes one, so that marker is text again. A marker is one character (one UTF-16 code unit) other than whitespace, `]`, `x` and `X`; any other key throws when the plugin is set up.

```ts
satteriTaskLists({
  markers: { b: "Bookmark", "?": "Frage", "<": false },
})
```

An empty label leaves the box without an `aria-label`.

### Read any marker

`fallback: true` reads any single character as a marker, as Obsidian does (one UTF-16 code unit, other than `]` and a line ending). A marker that is not listed gets `data-task` and no label. A marker removed with `false` stays text.

```ts
satteriTaskLists({ fallback: true })
```

### The stylesheet

The stylesheet leaves a to-do and a done box to the browser. For each of the six markers it draws an icon in place of the box, from [Lucide](https://lucide.dev): a dashed circle for in progress, a square with a minus for cancelled, an arrow for forwarded, a calendar for scheduled, a circle with a question mark and a triangle with an exclamation mark. Each has its own colour, a `light-dark()` pair, which you can change with a custom property on the item or any ancestor:

| Marker | Custom property |
| --- | --- |
| `/` | `--markdown-task-lists-in-progress` |
| `-` | `--markdown-task-lists-cancelled` |
| `>` | `--markdown-task-lists-forwarded` |
| `<` | `--markdown-task-lists-scheduled` |
| `?` | `--markdown-task-lists-question` |
| `!` | `--markdown-task-lists-important` |

```css
.content {
  --markdown-task-lists-question: oklch(0.6 0.16 300);
}
```

A value that is not a colour is ignored, and that marker keeps its default. The rules sit in `@layer markdown-task-lists`, so your own CSS overrides them without `!important`.

A marker you add through `markers` or `fallback` has no icon: it shows the browser's unchecked box. Give it one with the same rules the stylesheet uses, for the box in a tight list and in a loose one:

```css
li[data-task="b"] > input[type="checkbox"],
li[data-task="b"] > p > input[type="checkbox"] {
  appearance: none;
  inline-size: 1em;
  block-size: 1em;
  vertical-align: -0.125em;
  background-color: oklch(0.55 0.15 150);
  mask: url("bookmark.svg") center / contain no-repeat;
}
```

## Install

```sh
npm install @mirrordown/sat-task-lists
```

It works with Sätteri's `gfm` feature on and off. List it before the plugins for inline syntax (mark, kbd and so on) and abbr, so they read a task's text without its box.

### Standalone

```ts
import { markdownToHtml } from "satteri";
import { satteriTaskLists } from "@mirrordown/sat-task-lists";
import "@mirrordown/sat-task-lists/task-lists.css";

const { html } = markdownToHtml(source, {
  mdastPlugins: [satteriTaskLists()],
});
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import { satteriTaskLists } from "@mirrordown/sat-task-lists";

export default defineConfig({
  markdown: {
    processor: satteri({ mdastPlugins: [satteriTaskLists()] }),
  },
});

// In your layout:
import "@mirrordown/sat-task-lists/task-lists.css";
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
