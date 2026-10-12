---
"@mirrordown/remd-slug": patch
"@mirrordown/remd-autolink-headings": patch
---

Stop bundling `@types/hast`/`@types/unist` into the published type declarations. Both packages listed only `unified` in `pack.deps.neverBundle`, so tsdown inlined a private copy of the hast and unist declarations into `dist/index.d.mts` instead of emitting `import … from "hast"` like every other rehype package. The plugins' `Root` type was then distinct from the consumer's `hast.Root`, so passing them to Astro's `unified({ rehypePlugins })` (typed as `Plugin<any[], hast.Root>`) failed to type-check even though the plugins work at runtime. Both now mark `hast` and `unist` as never-bundle, matching `remd-lightbox`.
