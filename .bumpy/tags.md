---
"@mirrordown/mdit-tags": minor
"@mirrordown/remd-tags": minor
"@mirrordown/sat-tags": minor
"@mirrordown/core": minor
---

Add the tags plugin set: `#tag` in text becomes a link, as tags written in Obsidian are, the same in markdown-it, remark and Sätteri.

- **A `#` followed by a name is a tag.**

  ```markdown
  Filed under #inbox/to-read and #日本語.
  ```

  Renders `<a class="tag" href="#inbox/to-read">#inbox/to-read</a>` and `<a class="tag" href="#日本語">#日本語</a>`. A name is letters, numbers, `_`, `-`, `/` and emoji, with at least one character that is not a digit: `#1984` is text.

- **A tag starts only where a word could:** at the start of the text, after whitespace, or straight after another tag.

  ```markdown
  abc#def and (#note) are text. #Bob#Alice is two tags.
  ```

- **Tags are not read in code, in a link's text, in image alt text or in raw HTML,** so a URL's fragment (`https://example.com/#top`) is never one. A backslash keeps a hash literal: `\#not-a-tag`.

- **The `href` option sets where a tag links to,** for a site that has tag pages. It is called with the name without its `#`.

  ```ts
  remarkTags({ href: (name) => `/tags/${name}` })
  ```

- **An attribute block is read before tags are.** With the attrs plugin, `{.wide #intro}` gives an id and holds no tag. List the tags plugin after attrs and after the plugins for inline spans (mark, del, ins, kbd, spoiler); in Sätteri list it before the alerts plugin, so a tag can start an alert's title.

`@mirrordown/core` gains `scanTags`, `tagChildren` and `tagHref`, the scan the three plugins share.
