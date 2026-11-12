# @mirrordown/sat-tabs

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A Sätteri plugin for the `tabs` syntax extension.

## Overview

The `tabs` plugin converts `%`-prefixed headers and `>`-prefixed blockquote bodies into CSS-only tab groups. Tabs use hidden radio inputs for state — no JavaScript required.

```html
<div class="markdown-tabs" data-tabs-group="...">
  <div class="markdown-tabs-labels">...</div>
  <div class="markdown-tabs-panels">...</div>
</div>
```

## Syntax

Write a `% Label` line followed by a `>` blockquote for each tab's content:

````markdown
% JavaScript
> ```js
> console.log("Hello, world!");
> ```
% TypeScript
> ```ts
> const greeting: string = "Hello, world!";
> console.log(greeting);
> ```
% Python
> ```py
> print("Hello, world!")
> ```
````

### Default open tab

Mark a tab with `%+` to make it open by default (the first tab is open by default otherwise):

````markdown
% Option A
> This tab is not selected by default.
%+ Option B
> This tab opens by default.
% Option C
> This tab is not selected by default.
````

### Nested tabs

Use `%%` for a second level of nesting inside a tab:

````markdown
% Frontend
%% React
> ```tsx
> export function App() {
>   return <h1>Hello</h1>;
> }
> ```
%% Vue
> ```vue
> <template><h1>Hello</h1></template>
> ```
% Backend
> Node.js or any server runtime.
````

### Things to know

- Every line of a panel starts with `>`. A line that is neither a header nor a `>` line ends the tabs, and so does a blank line at the top level of the document.
- A blank line inside a panel needs the panel's `>`. Inside another block (a blockquote, a list item, a step), a blank line written without it ends the blocks before it (a list or a code fence does not continue across it), though the panel itself goes on with the next `>` line.
- A header is one line. Spaces at its end are not part of the label and make no line break, and a backslash at its end is a literal backslash.
- Tabs nest six levels deep (`%%%%%%`), one level at a time. A header that skips a level (`%%%` under `%`) or has more than six `%` is not a header.
- In a list item, write headers at the indentation of the item's content: a line written short of it continues the paragraph before it as text, as it does in CommonMark, whether it is a header or not. Where no paragraph is open for it to continue (after a code fence, say), such a line ends the item.
- In a blockquote, a line written without any `>` leaves the blockquote. Between two tabs, markdown-it ends the blockquote at that line and starts another for the tabs after it, while remark and Sätteri keep the line and those tabs in the one blockquote.
- Directly after a header, write a `>` line, another header or a blank line. remark and Sätteri read any other line as CommonMark does, together with the header: a `===` or `---` underline makes the header a heading, and a line that cannot interrupt a paragraph (a list item numbered other than 1, indented code, a link reference definition) stays text after the tabs. markdown-it reads the header first, so there the tabs end and the line is read on its own (as a list, code, a definition, a thematic break).
- With the steps plugin, leave a blank line between a tab group and a step header after it: directly under the last panel, the header starts steps in markdown-it and stays text in remark and Sätteri.
- An alert in a panel is written as a nested quote (`> > [!NOTE]`). Directly under a header, `> [!NOTE]` is the first line of the panel, as text. In remark and Sätteri that needs the alerts plugin listed after this one, as the presets list it: listed before, it has already made the quote an alert, which then follows the tabs.
- With the [`attrs`](/guide/plugins/attrs) plugin, attributes at the end of a header go on its label, and a block on the line after the tabs goes on the group. After a blank line, markdown-it and remark still put that block on the group, while Sätteri reads it as an empty paragraph of its own.
- A `>` indented four columns or more is not a panel's marker, as it is no blockquote's in CommonMark: the line continues the paragraph before it as text (directly after a header, that ends the tabs), and after a blank line it is indented code.
- A group's ids (the `name` and `id` of its inputs, the `for` of its labels) are unique per document, not per page. They are built from the group's labels and its place among the document's groups, so two documents rendered into one page repeat them where the same labels appear in the same place.
- The stylesheet targets the default container class, `markdown-tabs`. With another `containerClass` the tabs are yours to style, and the tab-icons plugin needs the same value.
- The stylesheet shows the selected tab's panel with a rule per tab position, written out for twelve tabs: keep a group to twelve or fewer.
- `remarkTabs` reads each line's `>` markers from the file's source, so it needs a tree parsed from that same file with positions, as `remark-parse` produces.

## Install

Install `@mirrordown/sat-tabs` and import the stylesheet. List it after the plugins for inline syntax (mark, kbd and so on), so a panel's `aria-label` reads the label's text rather than its markup, and before the alerts plugin:

```sh
npm install @mirrordown/sat-tabs
```

### Standalone

```ts
import { markdownToHtml } from "satteri";
import { satteriTabs } from "@mirrordown/sat-tabs";
import "@mirrordown/sat-tabs/tabs.css";

const { html } = markdownToHtml(source, {
  mdastPlugins: [satteriTabs()],
});
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import { satteriTabs } from "@mirrordown/sat-tabs";

export default defineConfig({
  markdown: {
    processor: satteri({ mdastPlugins: [satteriTabs()] }),
  },
});

// In your layout:
import "@mirrordown/sat-tabs/tabs.css";
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
