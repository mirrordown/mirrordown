# Changelog



## 0.1.2
<sub>2026-11-17</sub>

- *(patch)*
  Fixes for heading ids that could repeat, and for two places where markdown-it gave a heading a different id than remark and Sätteri.

  - **A generated id never repeats an id written by hand** (all engines).

    ```markdown
    ## B {#b}

    ## B
    ```

    Was `id="b"` on both headings. Now `id="b"` and `id="b-1"`. The hand-written ids are collected first, so the order of the headings doesn't matter, and the `prefix` option is taken into account.

  - **An empty id counts as no id** (markdown-it).

    ```markdown
    ## E {id=""}
    ```

    Was `<h2 id="">`. Now `<h2 id="e">`, as in remark and Sätteri.

  - **The id is built from all the text a heading shows** (markdown-it). Text that another plugin renders from its own syntax was left out. With the ruby plugin's `rp` set to `["open", "close"]`:

    ```markdown
    ## {漢字|kanji} ruby
    ```

    Was `id="漢字kanji-ruby"`. Now `id="漢字openkanjiclose-ruby"`, as in remark and Sätteri. With the usual `(` and `)` the id is unchanged.

## 0.1.1
<sub>2026-10-12</sub>

- *(patch)*
  Stop bundling `@types/hast`/`@types/unist` into the published type declarations. Both packages listed only `unified` in `pack.deps.neverBundle`, so tsdown inlined a private copy of the hast and unist declarations into `dist/index.d.mts` instead of emitting `import … from "hast"` like every other rehype package. The plugins' `Root` type was then distinct from the consumer's `hast.Root`, so passing them to Astro's `unified({ rehypePlugins })` (typed as `Plugin<any[], hast.Root>`) failed to type-check even though the plugins work at runtime. Both now mark `hast` and `unist` as never-bundle, matching `remd-lightbox`.

## 0.1.0
<sub>2026-07-01</sub>

- *(minor)*
  Add the `slug` plugin set: rehype and markdown-it plugins that add GitHub-style `id` slugs to headings (via `github-slugger`), so headings can be linked to. Both engines emit identical ids, repeated headings de-duplicate with a numeric suffix, and headings that already have an `id` (e.g. from `attrs`) are preserved.
