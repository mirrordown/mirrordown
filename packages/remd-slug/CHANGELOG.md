# Changelog


## 0.1.1
<sub>2026-10-12</sub>

- *(patch)*
  Stop bundling `@types/hast`/`@types/unist` into the published type declarations. Both packages listed only `unified` in `pack.deps.neverBundle`, so tsdown inlined a private copy of the hast and unist declarations into `dist/index.d.mts` instead of emitting `import … from "hast"` like every other rehype package. The plugins' `Root` type was then distinct from the consumer's `hast.Root`, so passing them to Astro's `unified({ rehypePlugins })` (typed as `Plugin<any[], hast.Root>`) failed to type-check even though the plugins work at runtime. Both now mark `hast` and `unist` as never-bundle, matching `remd-lightbox`.

## 0.1.0
<sub>2026-07-01</sub>

- *(minor)*
  Add the `slug` plugin set: rehype and markdown-it plugins that add GitHub-style `id` slugs to headings (via `github-slugger`), so headings can be linked to. Both engines emit identical ids, repeated headings de-duplicate with a numeric suffix, and headings that already have an `id` (e.g. from `attrs`) are preserved.
