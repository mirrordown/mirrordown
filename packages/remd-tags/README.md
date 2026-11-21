# @mirrordown/remd-tags

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A remark/rehype (unified) plugin for the `tags` syntax extension.

## Overview

The `tags` plugin renders a `#tag` written in running text as a link, the way Obsidian shows tags.

```html
<a class="tag" href="#tag">#tag</a>
```

The link's text is the tag as written, its `#` and its case included. The plugin ships no stylesheet and no script: style `a.tag` as your site needs.

## Syntax

Write `#` and a name, after a space or at the start of a line:

````markdown
Notes from the #meeting, with #inbox/to-read items for #project-x and #日本語.

#Bob#Alice is two tags; abc#def and #1984 are not tags.
````

A tag is `#` and a name with at least one character that is not an ASCII digit: `#1984` stays text, while `#y1984`, `#1/2` and `#１２３` are tags. The name is taken whole and ends at the first whitespace, ASCII punctuation other than `_`, `-` and `/`, or character from Unicode's General Punctuation (U+2000 to U+206F) and Supplemental Punctuation (U+2E00 to U+2E7F) blocks, the characters Obsidian ends a tag at. Every other character continues it, in any script: CJK punctuation does not end a tag, so `#a，b` and `#a「b」` are one tag each, and neither do `§` or emoji. So `#tag.` is the tag `#tag` and a full stop, and `#bob's` is the tag `#bob` and `'s`, as is `#bob’s` with a curly apostrophe. A zero-width joiner is General Punctuation, so `#👨‍👩‍👧` is the tag `#👨` followed by text, as in Obsidian, which keeps a site's tags the same as the vault's. A `/` writes a hierarchy, as in Obsidian (`#inbox/to-read`).

A `#` starts a tag only in three places: at the start of a paragraph, a heading, a table cell or any element's content (`*#tag*` is a tag inside emphasis), after whitespace or a line break, and right where another tag ends (`#Bob#Alice`). Anywhere else it is text: `abc#def`, `(#tag)`, `**bold**#tag`, and a `#` straight after a code span, a link, an image or raw HTML. A line that starts with `#tag` is a paragraph, since a heading needs a space after its `#`, and `# Heading #tagged` is a heading that holds a tag.

Tags are never read in code spans or code blocks, in the text of a link (written, an autolink, a bare URL that GFM or linkify makes a link, a footnote reference), in image alt text, or in raw HTML and HTML blocks. A URL's fragment, as in `https://example.com/#fragment`, is never a tag.

A backslash keeps a `#` as text (`\#tag`), and so does writing it as a character reference (`&#35;tag`). A character written either way inside a name ends the tag before it: `#a\_b` is the tag `#a` and the text `_b`. Whitespace written as a reference does not start a tag: to Obsidian a reference is literal text, so `&nbsp;#tag` and `a&#32;#tag` stay text.

> [!NOTE]
> Turning the plugin on changes prose that already holds such words: `#fff`, `#todo` or `#v2` after a space becomes a tag, while `#000` and `#1984` stay text. Write `\#fff` to keep one as text.

Attribute blocks are read before tags. With the [`attrs`](/guide/plugins/attrs) plugin or Sätteri's `attributes` feature on, `{.wide #intro}` gives an id and holds no tag, and a tag is plain text to a block: `#tag{.x}` is read the way `word{.x}` is, with the tag ending at the `{` and taking no attributes itself. Without attributes, a block is ordinary text and the `#intro` in it is a tag. A few things depend on the engine or the order of the plugins:

- In remark, list `remarkTags` after `remarkAttrs`: listed before it, a tag inside a block breaks the block, which then stays text. markdown-it's plugin is a core rule after `linkify`, so it runs after attrs whichever is added first, and Sätteri reads attributes in its parser, before any plugin.
- With the [`kbd`](/guide/plugins/kbd) plugin, a key's content does not open with a tag: `[[#heading]]` is how an Obsidian note links to one of its own headings, so it stays a key holding `#heading`, and adds no tag to the page. A tag after a space inside a key (`[[Fn #tag]]`) is still a tag.
- In remark and Sätteri, list the tags plugin after the kbd, del, ins, mark and spoiler plugins. They build their elements after parsing; listed before them, the tags plugin reads `==#tag==` as text, where the `#` follows a `=`. In markdown-it the order doesn't matter.
- The abbr plugins mark a defined term in any text, a tag's link included. Run the tags plugin first to keep every tag, and the term is marked inside its link: in markdown-it add `tags` after `abbr` (a core rule added later runs earlier), in remark and Sätteri list the tags plugin before the abbr plugin. In the other order a tag whose name holds a term is split at it, so `#HTML` becomes `#` and an abbreviation.
- A tag can start an alert's title (`> [!NOTE] #tag`). In Sätteri, list the tags plugin before the alerts plugin: once an alert is built its icon starts the title, and a tag written after the marker is then text. markdown-it and remark give the tag in either order.
- Smart punctuation rewrites `--` as a dash, and Astro turns it on by default (`smartypants` for remark, `smartPunctuation` for Sätteri). markdown-it finds tags before its typographer runs, so `#a--b` keeps `--` in its link and shows a dash in its text; remark and Sätteri see the dash, which ends the tag at `#a`. Turn smart punctuation off, or use a Mirrordown preset, which does.
- The remark plugin reads escapes from the source, so it needs the file: `processor.runSync(tree)` on a tree alone reads `\#tag` as a tag.

## A document's tags

Each plugin records the tags a document holds, for a site's tag pages or a list of tags beside a note. The list holds each tag's name without its `#`, once, in the order the tags first appear in the document. Two tags are the same tag when they are equal ignoring case, as Obsidian compares them, and the list keeps the casing written first: `#Inbox` and `#inbox` are one entry, `Inbox`. A `#` that renders as text (in code, in a link's text, escaped) is not in it. The list is always an array, empty for a document without tags, and is set afresh for every document. Each engine keeps it with the rest of a document's data:

`file.data.tags`, on the file the processor returns:

```ts
const file = await processor.process("Notes from the #meeting for #Inbox and #inbox.");
file.data.tags; // ["meeting", "Inbox"]
```

The list follows the document as each engine's plugins have built it by the time the tags plugin runs, so two combinations give the same links but different lists. markdown-it's and Sätteri's tabs plugins put every tab label before the panels, as the HTML does, so the tags of later labels come before those of earlier panels, while remark lists them as written. And an abbreviation's definition (`*[HTML]: Hyper #x`) is read before any tag in markdown-it, while in remark and Sätteri it is a paragraph until the abbr plugin, listed after the tags plugin, removes it, so the tag in it is listed there.

Each of the three packages also exports two helpers for building tag pages from the list:

- `tagKey(name)` says which tag a name is: the name in lower case, as Obsidian compares tags. Key a site's tag pages by it.
- `tagAncestors(name)` gives a nested tag and the tags it is nested under, outermost first: `tagAncestors("inbox/to-read")` is `["inbox", "inbox/to-read"]`. Obsidian counts a note tagged `#inbox/to-read` under `inbox` too, so a site lists it on both pages. Empty segments are skipped, so `a//b` gives `["a", "a//b"]`.

```ts
// The tag pages a note tagged #Inbox/To-Read and #work is listed on.
new Set(["Inbox/To-Read", "work"].flatMap(tagAncestors).map(tagKey));
// Set { "inbox", "inbox/to-read", "work" }
```

### Astro

In Astro, the remark and Sätteri plugins also keep the page's frontmatter `tags` up to date as the note's tags, the way Obsidian counts them: the tags the frontmatter lists, then the document's tags that are not among them. A page whose text adds no tag keeps its frontmatter as written. That frontmatter is the `remarkPluginFrontmatter` that `render(entry)` returns, so its `tags` holds the merged list:

```md
---
title: Weekly notes
tags: [work, "#project"]
---

Filed under #Work and #inbox/to-read.
```

```astro
---
import { getEntry, render } from "astro:content";

const entry = await getEntry("notes", "weekly");
const { Content, remarkPluginFrontmatter } = await render(entry);
// remarkPluginFrontmatter.tags is ["work", "project", "inbox/to-read"]
---
```

The frontmatter's `tags` is read as Obsidian reads the property: a list of strings or a single string, each with a leading `#` dropped. A frontmatter without `tags`, or with `tags:` left empty, gets the document's tags, an empty list when it has none. When `tags` holds anything else (a number, an object, a list with something other than a string in it), the frontmatter is left as it is. markdown-it has no frontmatter object, and records `env.tags` only.

## Install

```sh
npm install @mirrordown/remd-tags
```

### Unified

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkTags } from "@mirrordown/remd-tags";

const processor = unified()
  .use(remarkParse)
  .use(remarkTags)
  .use(remarkRehype)
  .use(rehypeStringify);
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { remarkTags } from "@mirrordown/remd-tags";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkTags],
  },
});
```

## Options

| Option | Type                       | Default                  | Description |
| ------ | -------------------------- | ------------------------ | ----------- |
| `href` | `(name: string) => string` | `#` and the name         | The link target of a tag, given its name without the `#`. The default adds no encoding: `#inbox/to-read` links to `#inbox/to-read`, and `#日本語` to `#日本語`. |

A site with a page per tag can link there:

```ts
remarkTags({ href: (name) => `/tags/${name.toLowerCase()}` });
// <a class="tag" href="/tags/inbox/to-read">#Inbox/To-Read</a>
```

The markdown-it and Sätteri plugins take the same option: `md.use(tags, { href })` and `satteriTags({ href })`.

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
