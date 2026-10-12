# Changelog


## 0.1.1
<sub>2026-10-12</sub>

- *(patch)*
  Stop bundling `@types/hast`/`@types/unist` into the published type declarations. Both packages listed only `unified` in `pack.deps.neverBundle`, so tsdown inlined a private copy of the hast and unist declarations into `dist/index.d.mts` instead of emitting `import … from "hast"` like every other rehype package. The plugins' `Root` type was then distinct from the consumer's `hast.Root`, so passing them to Astro's `unified({ rehypePlugins })` (typed as `Plugin<any[], hast.Root>`) failed to type-check even though the plugins work at runtime. Both now mark `hast` and `unist` as never-bundle, matching `remd-lightbox`.

## 0.1.0
<sub>2026-07-01</sub>

- *(minor)*
  Add the `autolink-headings` plugin set: rehype and markdown-it plugins that add self-referential anchor links to headings that have an `id` (pair with `slug`). Ships a JavaScript-free CSS `#` marker that reveals on hover, supports the `prepend`/`append`/`wrap`/`before`/`after` behaviors, and — on the rehype side — the full `content`/`properties`/`headingProperties`/`group`/`test` option surface.
