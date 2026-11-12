# @mirrordown/remd-attrs

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A remark/rehype (unified) plugin for the `attrs` syntax extension.

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

Braces that set nothing stay text: `{}`, `{ }`, `{x}` and `{a, b}` are left alone. So is a block with a quote that never closes, with a key that isn't a name (`{a/b=c}`), or written across two lines, or one that holds a character reference (`{title="a&amp;b"}`), except on a code fence, where the reference is decoded. To keep a block that would be read as text, escape its opening brace: `\{.note}`.

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

A table takes its block after a blank line, since a line written straight under a table is another row of it. A list takes one there too.

````markdown
| Name | Value |
| ---- | ----- |
| a    | 1     |

{.data}
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
npm install @mirrordown/remd-attrs
```

### Unified

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkAttrs } from "@mirrordown/remd-attrs";

const processor = unified()
  .use(remarkParse)
  .use(remarkAttrs)
  .use(remarkRehype)
  .use(rehypeStringify);
```

Add `remarkAttrs` after the Mirrordown plugins that build tabs and steps and after the inline ones (ruby, kbd, del, ins, mark, spoiler), and before the abbr and caption plugins, as the remark preset does. Tabs and steps leave their titles for it to read, and in the other order a block on a title is dropped without a warning. A block right after a span such as `--text--{.name}` is only placed on the span once the span exists, and listed before `remarkAttrs`, abbr marks a term inside a block's braces, which then stay text.

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { remarkAttrs } from "@mirrordown/remd-attrs";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkAttrs],
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

A block's attributes go into the HTML as the author wrote them. That includes event handlers (`{onclick=...}`), `style`, and URLs: a block after a link replaces its `href`, so `[x](/a){href="javascript:..."}` is a link that runs script. That holds in markdown-it too, which refuses such a URL when it is written in the link itself: markdown-it is safe for markdown you don't trust as long as raw HTML stays off, and with its defaults this plugin takes that away. remark-rehype and Sätteri pass a `javascript:` URL written in a link through as it is, so their output needs sanitizing for untrusted markdown with or without attribute blocks.

For markdown you don't trust, set `allowed` to the names you need, such as `allowed: ["class", "id"]`. It filters names, not values, so keep `href`, `src`, `style` and the `on*` handlers off the list. Sätteri's built-in feature has no such list: leave `attributes` off for untrusted input there, or sanitize the HTML it produces.

## Engine differences

Sätteri reads attribute blocks itself, and the markdown-it and remark plugins follow its grammar. These are the places it can't follow them:

- A class or a value can't hold `<`, `[`, `]` or a backtick. `{.w-[10px]}` and `{title="a<b"}` are read by the plugins and stay text on Sätteri. A value that holds a whole tag, as in `{title="a<b>c"}`, is read by markdown-it only: remark has parsed the tag as HTML before the plugin runs.
- The CSS-module shorthand `{..name}` sets `css-module="name"` with the plugins. Sätteri has no such form and reads it as the class `.name`.
- A block ending a heading isn't read when the heading has a closing sequence, as in `# Title {.a} #`, or when the block holds a backslash, as in `# Title {data-path="C:\dir"}`. A block ending a heading that holds a character reference is read, where the plugins leave it as text, and the reference is not decoded: `# Title {data-x="a&amp;b"}` gives `data-x="a&amp;amp;b"`.
- A backslash escape earlier in the same text keeps a block from being read, as in `\* text {.a}`. An escaped brace ending a heading is read anyway, and `# Title \{#x}` gets the id.
- A table cell that holds an escaped pipe never gets a block of its own: in `| a\|b {.c} |` the block stays text. A block touching an element inside the cell still goes on that element.
- When a block touches a span a Mirrordown plugin builds, such as `--a--{#s}`, and a block on the next line sets an id too, the paragraph's id is lost: Sätteri keeps one id per paragraph while it parses, before the plugin gives the first to the span. The paragraph's other attributes stay.
- Sätteri's own subscript and superscript take no block: `x~2~{.s} t` keeps the braces as text, and `x~2~{.s}` at the end of a paragraph, heading or list item sets the class on that element.
- Of two blocks on lines of their own, one under the other, only the last is read: after `text`, `{.a}` then `{.b}` gives `class="b a"` with the plugins, and `class="b"` with `{.a}` left as text on Sätteri.
- A block on a line between a setext heading's text and its underline is read, and leaves a line ending at the end of the heading's content.
- A block in a paragraph of its own after an alert and a blank line goes on the alert with the plugins. Sätteri reads it as that empty paragraph's own.
- There are no options, so no custom delimiters, no `allowed` list and no way to turn single rules off.

markdown-it writes an attribute's name as you typed it, where remark and Sätteri spell a name HTML defines the way HTML does: `{Title=x}` gives `Title="x"` on markdown-it and `title="x"` on the other two. A browser reads both as `title`. remark-rehype's serializer also writes an empty value as the bare name (`{hidden}` is `hidden` there and `hidden=""` on the other two) and a backtick in a value as `&#x60;`. Those are the same to a browser too.

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
