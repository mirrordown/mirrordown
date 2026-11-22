# @mirrordown/sat-block-ids

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A Sätteri plugin for the `block-ids` syntax extension.

## Overview

In Obsidian, `^` and an identifier at the end of a block names that block, so a link can point at it: `[[Note#^37066d]]`. Without a plugin the marker is published as text. The `block-ids` plugin removes the marker and gives the block a real HTML `id`, so a link to `#^37066d` resolves in a browser.

**Markdown:**
```markdown
The quick purple gem dashes through the paragraph. ^37066d

- Gemmy ^item-1
- Unhelpful assistant

> [!tip] Tip
> Body
^my-callout
```

**HTML:**
```html
<p id="^37066d">The quick purple gem dashes through the paragraph.</p>
<ul><li id="^item-1">Gemmy</li><li>Unhelpful assistant</li></ul>
<div class="markdown-alert" data-alert="tip" id="^my-callout">…</div>
```

The `id` holds the `^` and the identifier: it is the fragment Obsidian itself writes, and it can't collide with a heading's slug, which never has a `^`. There are no options, no stylesheet and no script, and nothing is collected on the side.

## The marker

A marker is `^` followed by one or more letters (`A`–`Z`, `a`–`z`), digits or hyphens, at the very end of the last line of a paragraph or a heading, either at the start of that line or after a space or a tab. The `id` keeps the identifier as written, upper case included.

- **Nothing may follow it on its line.** `text ^blk ` with a space after it is text, as in Obsidian. What the parser or another plugin takes off the end of the line doesn't count: an ATX heading's closing `#`s, or an attribute block that [attrs](/guide/plugins/attrs) reads.
- **`_` is not an identifier character.** `^blk_x` and `^__proto__` are text.
- **A caret after a word is text.** `not-a-marker^abc`, `E = mc^2` and `` `code`^blk `` stay as they are, and so does `^abc is not at the end`.
- **It is written as plain text.** A `^` written as an escape (`\^blk`) or a character reference (`&#94;blk`) is text. So is a marker inside emphasis, a link, a highlight or a code span (`*x ^blk*`, `[^blk](u)`, `` `^blk` ``), and nothing in a code block, a fence or raw HTML is read.
- **Only the last marker counts.** `text ^one ^two` names the block `^two` and leaves `text ^one`.

The marker is removed with the whitespace before it. When it stands alone on the block's last line, the line ending, or the hard break, before it goes too: no `<br>` and no trailing space are left.

````markdown
Some text
^own-line

[Back to the paragraph](#^own-line)
````

```html
<p id="^own-line">Some text</p>
```

## What a marker names

### A paragraph

A marker at the end of a paragraph with other content names that paragraph.

````markdown
The quick purple gem dashes through the paragraph. ^gem-paragraph

[Back to the paragraph](#^gem-paragraph)
````

### A heading

A marker at the end of an ATX or a setext heading names the heading. The marker is not part of the heading's text, so it is not in its slug either.

````markdown
#### A named heading ^named-heading

[Back to the heading](#^named-heading)
````

### A list item

A marker in a paragraph of a list item names the innermost list item, including a marker alone on a continuation line of the item and one alone in its own paragraph inside a loose item.

````markdown
- Gemmy ^item-gemmy
- Unhelpful assistant
    - A nested item
      ^item-nested

[Back to Gemmy](#^item-gemmy), [back to the nested item](#^item-nested)
````

### A quote or an alert

A marker anywhere inside a block quote or an alert names the **outermost** quote or alert around it: from its body, from its title line, from a list item inside it, and from a lazy continuation line after it, as below, where the marker's line continues the alert's paragraph. Two markers in one quote name it twice, and the last one wins.

````markdown
> [!tip] Tip
> A purple gem.
^gem-tip

[Back to the tip](#^gem-tip)
````

A marker that ends an alert's title line names the alert when the title line is the whole of its paragraph; one followed by body lines in the same paragraph is text. A title that held only a marker is the type's own (`> [!note] ^blk` is titled "Note"). With remark that is the type's default title, even where github-alerts' `titles` option names another: remark's alert doesn't keep the title it would have given.

A tab panel or a step is written with `>` but is not a quote: a marker there names its own paragraph or list item, and a real quote inside a panel is named as a quote. A marker on a step's title or a tab's label is text, as a title is not a paragraph.

### Any block, from a paragraph of its own

A marker alone in its own paragraph, outside any list item and quote, names the block before it, whatever it is: a paragraph, a list, a table, a code block, a quote or an alert, a heading, a thematic break, a group of tabs or steps, a figure. The marker's paragraph is removed, leaving no empty `<p>`. With no block before it, nothing is named and the paragraph is removed all the same, as in Obsidian.

````markdown
| Gem | Colour |
| --- | --- |
| Amethyst | Purple |

^gem-table

[Back to the table](#^gem-table)
````

A code block's id goes on its `<code>`, where attrs puts one. Raw HTML has no element to carry an id, so a marker alone after an HTML block names nothing; a link reference definition renders nothing, so a marker alone after one names the block before it.

## Linking to a block

Link to a named block with its id as the fragment: `[text](#^37066d)`. Every engine writes the caret in the link's `href` as `%5E` (`href="#%5E37066d"`), which a browser decodes when it looks the fragment up. In a CSS selector the caret has to be escaped, `#\^37066d`, or matched as an attribute, `[id="^37066d"]`; `document.getElementById("^37066d")` takes it as it is. Obsidian's wikilink form, `[[Note#^37066d]]`, is not part of this plugin.

## Duplicates

One element has one id. When two markers name the same element (two items' markers inside one quote), the last one is its id. When the same identifier names two elements, the element named last keeps it and the earlier one gets no id, as Obsidian resolves a duplicate. Every marker is removed either way.

````markdown
First paragraph. ^twice

Second paragraph. ^twice
````

```html
<p>First paragraph.</p>
<p id="^twice">Second paragraph.</p>
```

## Attribute blocks and slugs

An id written by hand wins. With [attrs](/guide/plugins/attrs) (or Sätteri's `attributes` feature), `{#name}` on the same block, after the marker or on its own line after the block, is the block's id, and the marker is only removed. Other attributes stay beside the marker's id.

```markdown
Some text ^blk {#name}

Other text ^blk
{#other}

A note ^note {.callout}
```

```html
<p id="name">Some text</p>
<p id="other">Other text</p>
<p class="callout" id="^note">A note</p>
```

An attribute block written before the marker doesn't end the block, so it stays text: `text {.x} ^blk` gives `<p id="^blk">text {.x}</p>`.

With [slug](/guide/plugins/slug), a heading a marker names keeps the marker's id, as a heading with `{#name}` keeps that: an id the author wrote replaces a generated one. Slug doesn't count that heading's text as used, so the next heading with the same text takes the first free slug. [autolink-headings](/guide/plugins/autolink-headings) links to the marker's id, and [sectionize](/guide/plugins/sectionize) leaves it on the heading.

```markdown
## Same
## Same ^named
## Same
```

```html
<h2 id="same">Same</h2>
<h2 id="^named">Same</h2>
<h2 id="same-1">Same</h2>
```

## The cost

A paragraph, a heading or a list item can't end in a space and `^word` without being named by it: `Stop it with ^C` loses `^C` and gets `id="^C"`. Write it as code (`` `^C` ``), escape the caret (`\^C`), or put anything after it on the line, a full stop included.

## With other plugins

- **Captions.** A caption line is the paragraph's last line when block-ids reads it, so a marker ending a caption (`~: A caption ^fig`) names the figure: caption moves the paragraph's id onto it, as it moves attributes. A marker before the caption line (`Para ^x` / `~: A caption`) is not at the end of the paragraph, and stays text, as in Obsidian.
- **Definition lists.** A marker in a definition names its `<dd>`, as a list item's names the item; a tight definition renders no `<p>` to carry it. A marker on a term is text.
- **Footnotes.** A marker at the end of a footnote's definition names its paragraph; a paragraph ending in a footnote reference has no marker.
- **unwrap-images.** An image alone in a named paragraph is taken out of the paragraph, and the paragraph's id goes with it, as an id written with attrs does.
- **Superscript.** `^st^` is a superscript, not a marker, and a marker after one is still read: `31^st^ of May ^date`.
- **Smart punctuation.** A host's smart punctuation can turn `--` in an identifier into a dash before the marker is read, which leaves it text: Sätteri's `smartPunctuation` feature does (Astro turns it on). markdown-it's typographer runs after this plugin. The presets turn smart punctuation off.

## Differences from Obsidian

- **A stricter marker.** Obsidian reads a caret after an escaped bracket (`x\[^1` names a block `1`) and inside emphasis or a link's text (`*^blk*`, `[^blk](u)`); these are text here. The id is a real `id`, where Obsidian's Reading view writes no attribute.
- **CommonMark's lines.** A line without `>` after a quote continues its paragraph, so `> A quotation.` / `^37066f` / `Next.` is one paragraph whose last line is `Next.`, and the marker is text. A marker on a line straight after a list continues its last item, and names that item, not the list. Write a blank line before a marker meant for the block above it.
- **Headings are named,** as Obsidian names them.

## Install

```sh
npm install @mirrordown/sat-block-ids
```

List it after sat-tabs and sat-steps, and before sat-github-alerts, sat-abbr and sat-caption. After sat-github-alerts the id still reaches the alert, but an alert keeps no position there, so a caret written straight after its type (`> [!tip]^x`) passes for a marker. Sätteri reads attribute blocks itself, with its `attributes` feature, before any plugin.

### Standalone

```ts
import { markdownToHtml } from "satteri";
import { satteriBlockIds } from "@mirrordown/sat-block-ids";

const { html } = markdownToHtml(source, {
  mdastPlugins: [satteriBlockIds()],
});
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import { satteriBlockIds } from "@mirrordown/sat-block-ids";

export default defineConfig({
  markdown: {
    processor: satteri({ mdastPlugins: [satteriBlockIds()] }),
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
