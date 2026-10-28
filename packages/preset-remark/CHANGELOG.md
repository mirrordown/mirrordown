# Changelog


## 0.2.0
<sub>2026-10-28</sub>

- *(minor)*
  Add `mermaidPele`, on by default like every other feature: ` ```mermaid ` code blocks render to inline SVG with Pele, and the presets' stylesheets include its theme. With remark, stringify with `allowDangerousHtml: true` (Astro already does); in Astro, leave `mermaid` out of highlighting with `syntaxHighlight: { type: "shiki", excludeLangs: ["mermaid"] }`, since Astro highlights code blocks before the plugins run.
- *(minor)*
  Add `caption`, on by default like every other feature: a `~:` line right after a block captions it, wrapping the block in a `<figure>`. The presets' stylesheets include its styles.
- *(patch)*
  Captioned lightbox images: a lightbox image (`!![alt](src)`) followed by a `~:` caption is now the figure's content, so its trigger sits directly in the `<figure>` without unwrap-images. The lightbox plugins take a `caption` option (off by default) that shows a captioned image's caption under it in the dialog; repeated images share one dialog, which shows the first caption any of them has. The presets pass lightbox options through (`lightbox: { caption: true }`). The lightbox READMEs are now generated from its guide.

## 0.1.0
<sub>2026-10-28</sub>

- *(minor)*
  New presets for adopting the whole suite in one call: `@mirrordown/preset-markdown-it` (`md.use(mirrordown, options)`) and `@mirrordown/preset-remark` (`mirrordown(options)`, which plugs into Astro's `unified()` processor or a unified pipeline). Every feature is on by default, `false` turns one off, and an options object configures it. Each preset also ships a stylesheet that imports every plugin's CSS.

  `mdit-autolink-headings` no longer adds an anchor to a heading whose id is empty (a heading with no text, such as one holding only an image): there is nothing to link to, and `remd-autolink-headings` already skipped it.
- *(patch)*
  Attrs run after the other remark plugins, as `mdit-attrs` does in markdown-it, so attributes on a step title (`@1. Step {.cls}`) or a tab label (`% Tab {.cls}`) reach the step or tab instead of being dropped.
- *(patch)*
  `remd-github-alerts` applies other plugins' `data` to a blockquote that isn't an alert, as remark-rehype's own handler does, so attributes on a blockquote (`> quote` then `{.note}`) are no longer dropped when alerts are on.
