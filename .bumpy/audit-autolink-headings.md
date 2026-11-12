---
"@mirrordown/mdit-autolink-headings": patch
"@mirrordown/remd-autolink-headings": patch
"@mirrordown/sat-autolink-headings": patch
---

Fixes for the link markdown-it writes, and for options the three engines read differently.

- **The heading's id is escaped in the link** (markdown-it). With the attrs plugin a heading can be given any id:

  ```markdown
  ## T {id='a"b'}
  ```

  Was `<a class="anchor" … href="#a"b">`: the quote ended the `href` early, so the rest of the id was read as a new attribute. Now `href="#a&quot;b"`, as in remark and Sätteri. The `class` option is escaped the same way.

- **An unknown `behavior` throws** (all engines). A value that is none of `prepend`, `append`, `wrap`, `before` and `after` used to give no link in markdown-it and, in remark and Sätteri, a link placed as `append` without its `aria-hidden` and `tabindex`.

- **`behavior: null` means the default, `prepend`** (Sätteri). It used to place the link as `append`, without its `aria-hidden` and `tabindex`.

- **The link points at an id set through `headingProperties`** (Sätteri). With `headingProperties: { id: "other" }`, `## T` used to get `<h2 id="other">` with a link to `#t`; the link is now `href="#other"`, as in remark, and the `properties`, `content` and `group` callbacks see the new properties.
