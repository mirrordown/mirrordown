# @mirrordown/mdit-attrs

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A markdown-it plugin for the `attrs` syntax extension.

## Overview

The `attrs` plugin lets you attach HTML attributes (classes, IDs, data attributes, etc.) to almost any Markdown element using `{...}` syntax. It supports headings, paragraphs, code fences, inline elements, lists, tables, and horizontal rules.

```html
<h2 id="my-section" class="highlight">My Section</h2>
```

## Syntax

Attributes are written in curly braces using CSS-like shorthand:

- `#id` → sets `id`
- `.class` → adds a class
- `key=value` → sets any attribute

Words inside the braces are separated by spaces or tabs. A value that holds spaces is quoted, with `"` or `'`, as in `{title="A longer title"}`. A word of two or more characters with no `=` is an attribute with an empty value, as in `{hidden}`, and a lone character is ignored. Setting an attribute the element already has replaces its value. Classes add up.

Braces that set nothing stay text: `{}`, `{ }`, `{x}` and `{a, b}` are left alone. So is a block with a quote that never closes, with a key that isn't a name (`{a/b=c}`), or written across two lines. To keep a block that would be read as text, escape its opening brace: `\{.note}`.

### Headings

````markdown
## My Section {#my-section .highlight}
````

### Code fences

````markdown
```ts {.language-typescript data-filename="example.ts"}
const x = 1;
```
````

### Paragraphs

````markdown
A paragraph with a custom class.
{.note}
````

### Inline elements

````markdown
This is **important**{.warning} text.
````

### After lists and tables

````markdown
- Item one
- Item two
{.checklist}
````

### Inside blockquotes and lists

A block on a line of its own goes on the block it's written after, at the level its `>` markers and indentation put it, as kramdown places a block IAL. Written inside a blockquote or list item, it goes on the paragraph, or on the item in a tight list. Written outside one, as a lazy continuation line, it goes on that blockquote, or on the item's list.

````markdown
> A quoted paragraph.
> {.note}

> A quoted paragraph.
{.callout}

- Item one
  {.first}
- Item two
````

markdown-it-attrs can't see a line's indentation, so it gives such a line to the outermost block that ends with the paragraph instead.

## Install

```sh
npm install @mirrordown/mdit-attrs
```

### Standalone

```ts
import MarkdownIt from "markdown-it";
import { attrs } from "@mirrordown/mdit-attrs";

const md = new MarkdownIt().use(attrs);
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { attrs } from "@mirrordown/mdit-attrs";

export default defineConfig({
  markdown: {
    config: (md) => md.use(attrs),
  },
});
```

## Options

| Option    | Type                           | Default | Description                                                                                                                                                                                  |
| --------- | ------------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `left`    | `string`                       | `"{"`   | Opening delimiter.                                                                                                                                                                           |
| `right`   | `string`                       | `"}"`   | Closing delimiter.                                                                                                                                                                           |
| `allowed` | `Array<string \| RegExp>`      | `[]`    | The attribute names a block may set. A string must equal the name, a pattern must match it. `.x` counts as `class` and `#x` as `id`. Other attributes are dropped. Empty allows every name. |
| `rule`    | `"all" \| boolean \| string[]` | `"all"` | Where blocks are read: any of `"fence"`, `"inline"`, `"table"`, `"list"`, `"heading"`, `"hr"`, `"softbreak"` and `"block"`. `false` or `[]` reads none.                                      |

```ts
remarkAttrs({ allowed: ["class", "id", /^data-/] });
md.use(attrs, { allowed: ["class", "id", /^data-/] });
```

Sätteri's built-in `attributes` feature takes no options.

## Security

A block's attributes go into the HTML as the author wrote them. That includes event handlers (`{onclick=...}`), `style`, and URLs: a block after a link replaces its `href` after the engine has checked the link's own URL, so `[x](/a){href="javascript:..."}` is a link that runs script. markdown-it and remark are safe for markdown you don't trust as long as raw HTML stays off. With its defaults, this plugin takes that away.

For markdown you don't trust, set `allowed` to the names you need, such as `allowed: ["class", "id"]`. It filters names, not values, so keep `href`, `src`, `style` and the `on*` handlers off the list. Sätteri's built-in feature has no such list: leave `attributes` off for untrusted input there, or sanitize the HTML it produces.

## Engine differences

Sätteri reads attribute blocks itself, and the markdown-it and remark plugins follow its grammar. These are the places it can't follow them:

- A class or a value can't hold `<`, `[`, `]` or a backtick. `{.w-[10px]}` and `{title="a<b"}` are read by the plugins and stay text on Sätteri.
- The CSS-module shorthand `{..name}` sets `css-module="name"` with the plugins. Sätteri has no such form and reads it as the class `.name`.
- A block ending a heading isn't read when the heading has a closing sequence, as in `# Title {.a} #`, or when the block holds a backslash, as in `# Title {data-path="C:\dir"}`.
- A backslash escape earlier in the same text keeps a block from being read, as in `\* text {.a}`. An escaped brace ending a heading is read anyway, and `# Title \{#x}` gets the id.
- A table cell that holds an escaped pipe never gets a block of its own: in `| a\|b {.c} |` the block stays text. A block touching an element inside the cell still goes on that element.
- When a block touches a span a Mirrordown plugin builds, such as `--a--{#s}`, and a block on the next line sets an id too, the paragraph's id is lost: Sätteri keeps one id per paragraph while it parses, before the plugin gives the first to the span. The paragraph's other attributes stay.
- There are no options, so no custom delimiters, no `allowed` list and no way to turn single rules off.

markdown-it writes an attribute's name as you typed it, where remark and Sätteri spell a name HTML defines the way HTML does: `{Title=x}` gives `Title="x"` on markdown-it and `title="x"` on the other two. A browser reads both as `title`.

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
