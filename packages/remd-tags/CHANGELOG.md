# Changelog


## 0.1.1
<sub>2026-11-26</sub>

- *(patch)* Updated dependency `@mirrordown/core` v0.4.0

## 0.1.0
<sub>2026-11-24</sub>

- *(minor)*
  Add the tags plugin set: `#tag` in text becomes a link, read the way Obsidian reads a tag, the same in markdown-it, remark and Sätteri. Each plugin also records the document's tags, for the page that lists them.

  - **A `#` followed by a name is a tag.**

    ```markdown
    Filed under #inbox/to-read and #日本語.
    ```

    Renders `<a class="tag" href="#inbox/to-read">#inbox/to-read</a>` and `<a class="tag" href="#日本語">#日本語</a>`.

  - **A name ends where Obsidian ends it:** at whitespace, at ASCII punctuation other than `_`, `-` and `/`, and at the characters of the General Punctuation and Supplemental Punctuation blocks (`…`, `’`, a zero-width joiner). Everything else is part of the name, CJK punctuation included, so leave a space after a tag as you would in Obsidian. A name needs one character that is not a digit: `#1984` is text, `#y1984` is a tag.

    ```markdown
    #tag. and #bob's end at the punctuation. #标签，然后 is one tag.
    ```

    These are the characters Obsidian 1.15.0 was measured to accept, so a site's tags are the ones the vault lists.

  - **A tag starts only where a word could:** at the start of the text, after whitespace, or straight after another tag.

    ```markdown
    abc#def and (#note) are text. #Bob#Alice is two tags.
    ```

    Whitespace written as a character reference does not count (`&nbsp;#tag` is text), and with the kbd plugin a key's content does not open with a tag, so `[[#heading]]`, which links to a heading in Obsidian, adds no tag to a page.

  - **Tags are not read in code, in a link's text, in image alt text or in raw HTML,** so a URL's fragment (`https://example.com/#top`) is never one. A backslash keeps a hash literal: `\#not-a-tag`.

  - **The document's tags are recorded** where each engine keeps per-document data: `env.tags` for markdown-it, `file.data.tags` for remark, `ctx.data.tags` for Sätteri. Names without the `#`, each tag once whatever its casing, in the order they first appear.

    ```ts
    const env = {};
    md.render("Notes from the #meeting for #Inbox and #inbox.", env);
    env.tags; // ["meeting", "Inbox"]
    ```

    In Astro, the remark and Sätteri plugins also add them to the page's frontmatter `tags`, after the tags the frontmatter lists, so `remarkPluginFrontmatter.tags` is the note's tags as Obsidian counts them. A page whose text adds no tag keeps its frontmatter as written.

  - **`tagKey` and `tagAncestors`**, exported by each package, are for building tag pages: `tagKey("Inbox")` is `"inbox"`, since tags are compared ignoring case, and `tagAncestors("inbox/to-read")` is `["inbox", "inbox/to-read"]`, since a nested tag belongs to each tag above it.

  - **The `href` option sets where a tag links to,** for a site that has tag pages. It is called with the name without its `#`.

    ```ts
    remarkTags({ href: (name) => `/tags/${name}` })
    ```

  - **An attribute block is read before tags are.** With the attrs plugin, `{.wide #intro}` gives an id and holds no tag. List the tags plugin after attrs and after the plugins for inline spans (mark, del, ins, kbd, spoiler); in Sätteri list it before the alerts plugin, so a tag can start an alert's title.

  `@mirrordown/core` gains `scanTags`, `tagChildren`, `tagHref`, `createTagCollector`, `tagKey` and `tagAncestors`, the scan and the list the three plugins share.
