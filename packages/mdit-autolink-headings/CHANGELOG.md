# Changelog



## 0.1.2
<sub>2026-11-17</sub>

- *(patch)*
  Fixes for the link markdown-it writes, and for options the three engines read differently.

  - **The heading's id is escaped in the link** (markdown-it). With the attrs plugin a heading can be given any id:

    ```markdown
    ## T {id='a"b'}
    ```

    Was `<a class="anchor" … href="#a"b">`: the quote ended the `href` early, so the rest of the id was read as a new attribute. Now `href="#a&quot;b"`, as in remark and Sätteri. The `class` option is escaped the same way.

  - **An unknown `behavior` throws** (all engines). A value that is none of `prepend`, `append`, `wrap`, `before` and `after` used to give no link in markdown-it and, in remark and Sätteri, a link placed as `append` without its `aria-hidden` and `tabindex`.

  - **`behavior: null` means the default, `prepend`** (Sätteri). It used to place the link as `append`, without its `aria-hidden` and `tabindex`.

  - **The link points at an id set through `headingProperties`** (Sätteri). With `headingProperties: { id: "other" }`, `## T` used to get `<h2 id="other">` with a link to `#t`; the link is now `href="#other"`, as in remark, and the `properties`, `content` and `group` callbacks see the new properties.

## 0.1.1
<sub>2026-10-28</sub>

- *(patch)*
  New presets for adopting the whole suite in one call: `@mirrordown/preset-markdown-it` (`md.use(mirrordown, options)`) and `@mirrordown/preset-remark` (`mirrordown(options)`, which plugs into Astro's `unified()` processor or a unified pipeline). Every feature is on by default, `false` turns one off, and an options object configures it. Each preset also ships a stylesheet that imports every plugin's CSS.

  `mdit-autolink-headings` no longer adds an anchor to a heading whose id is empty (a heading with no text, such as one holding only an image): there is nothing to link to, and `remd-autolink-headings` already skipped it.

## 0.1.0
<sub>2026-07-01</sub>

- *(minor)*
  Add the `autolink-headings` plugin set: rehype and markdown-it plugins that add self-referential anchor links to headings that have an `id` (pair with `slug`). Ships a JavaScript-free CSS `#` marker that reveals on hover, supports the `prepend`/`append`/`wrap`/`before`/`after` behaviors, and — on the rehype side — the full `content`/`properties`/`headingProperties`/`group`/`test` option surface.
