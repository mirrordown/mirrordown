# @mirrordown/mdit-tags

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A markdown-it plugin for the `tags` syntax extension.

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

A tag is `#` and a name made of letters, marks and numbers of any script, `_`, `-`, `/`, and emoji or other symbols outside ASCII, with at least one character that is not a digit: `#1984` stays text, while `#y1984` and `#1/2` are tags. The name is taken whole and ends at the first other character, a space or any other ASCII punctuation, so `#tag.` is the tag `#tag` and a full stop, and `#bob's` is the tag `#bob` and `'s`. A `/` writes a hierarchy, as in Obsidian (`#inbox/to-read`).

A `#` starts a tag only in three places: at the start of a paragraph, a heading, a table cell or any element's content (`*#tag*` is a tag inside emphasis), after whitespace or a line break, and right where another tag ends (`#Bob#Alice`). Anywhere else it is text: `abc#def`, `(#tag)`, `**bold**#tag`, and a `#` straight after a code span, a link, an image or raw HTML. A line that starts with `#tag` is a paragraph, since a heading needs a space after its `#`, and `# Heading #tagged` is a heading that holds a tag.

Tags are never read in code spans or code blocks, in the text of a link (written, an autolink, a bare URL that GFM or linkify makes a link, a footnote reference), in image alt text, or in raw HTML and HTML blocks. A URL's fragment, as in `https://example.com/#fragment`, is never a tag.

A backslash keeps a `#` as text (`\#tag`), and so does writing it as a character reference (`&#35;tag`). A character written either way inside a name ends the tag before it: `#a\_b` is the tag `#a` and the text `_b`. Whitespace written as a reference (`&nbsp;`) is whitespace like any other.

> [!NOTE]
> Turning the plugin on changes prose that already holds such words: `#fff`, `#todo` or `#v2` after a space becomes a tag, while `#000` and `#1984` stay text. Write `\#fff` to keep one as text.

Attribute blocks are read before tags. With the [`attrs`](/guide/plugins/attrs) plugin or Sätteri's `attributes` feature on, `{.wide #intro}` gives an id and holds no tag, and a tag is plain text to a block: `#tag{.x}` is read the way `word{.x}` is, with the tag ending at the `{` and taking no attributes itself. Without attributes, a block is ordinary text and the `#intro` in it is a tag. A few things depend on the engine or the order of the plugins:

- In remark, list `remarkTags` after `remarkAttrs`: listed before it, a tag inside a block breaks the block, which then stays text. markdown-it's plugin is a core rule after `linkify`, so it runs after attrs whichever is added first, and Sätteri reads attributes in its parser, before any plugin.
- In remark and Sätteri, list the tags plugin after the kbd, del, ins, mark and spoiler plugins. They build their elements after parsing; listed before them, the tags plugin reads `==#tag==` as text, where the `#` follows a `=`. In markdown-it the order doesn't matter.
- The abbr plugins mark a defined term in any text, a tag's link included. Run the tags plugin first to keep every tag, and the term is marked inside its link: in markdown-it add `tags` after `abbr` (a core rule added later runs earlier), in remark and Sätteri list the tags plugin before the abbr plugin. In the other order a tag whose name holds a term is split at it, so `#HTML` becomes `#` and an abbreviation.
- A tag can start an alert's title (`> [!NOTE] #tag`). In Sätteri, list the tags plugin before the alerts plugin: once an alert is built its icon starts the title, and a tag written after the marker is then text. markdown-it and remark give the tag in either order.
- Smart punctuation rewrites `--` as a dash, and Astro turns it on by default (`smartypants` for remark, `smartPunctuation` for Sätteri). markdown-it finds tags before its typographer runs, so `#a--b` keeps `--` in its link and shows a dash in its text; remark and Sätteri see the dash, which ends the tag at `#a`. Turn smart punctuation off, or use a Mirrordown preset, which does.
- The remark plugin reads escapes from the source, so it needs the file: `processor.runSync(tree)` on a tree alone reads `\#tag` as a tag.

## Install

```sh
npm install @mirrordown/mdit-tags
```

### Standalone

```ts
import MarkdownIt from "markdown-it";
import { tags } from "@mirrordown/mdit-tags";

const md = new MarkdownIt().use(tags);
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { tags } from "@mirrordown/mdit-tags";

export default defineConfig({
  markdown: {
    config: (md) => md.use(tags),
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
