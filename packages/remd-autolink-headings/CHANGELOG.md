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
<sub>2026-10-12</sub>

- *(patch)*
  Stop bundling `@types/hast`/`@types/unist` into the published type declarations. Both packages listed only `unified` in `pack.deps.neverBundle`, so tsdown inlined a private copy of the hast and unist declarations into `dist/index.d.mts` instead of emitting `import … from "hast"` like every other rehype package. The plugins' `Root` type was then distinct from the consumer's `hast.Root`, so passing them to Astro's `unified({ rehypePlugins })` (typed as `Plugin<any[], hast.Root>`) failed to type-check even though the plugins work at runtime. Both now mark `hast` and `unist` as never-bundle, matching `remd-lightbox`.

## 0.1.0
<sub>2026-07-01</sub>

- *(minor)*
  Add the `autolink-headings` plugin set: rehype and markdown-it plugins that add self-referential anchor links to headings that have an `id` (pair with `slug`). Ships a JavaScript-free CSS `#` marker that reveals on hover, supports the `prepend`/`append`/`wrap`/`before`/`after` behaviors, and — on the rehype side — the full `content`/`properties`/`headingProperties`/`group`/`test` option surface.
