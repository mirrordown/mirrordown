# @mirrordown/core

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

Shared, engine-agnostic logic used by Mirrordown's plugins, so the markdown-it (`mdit-*`), remark/rehype (`remd-*`) and Sätteri plugins for a feature behave identically. It has no dependencies and is installed automatically with the plugins that need it; you don't need to depend on it directly.

## Escapes

Parsers resolve backslash escapes before any post-parse transform runs, so a plugin that scans text for delimiters would see `\==not marked==` as `==not marked==`. These helpers recover which characters of a text node were escaped, by aligning the node's value with its source, and mask them while the plugin scans:

- `escapedIndices(value, source, start, end)` — indices of `value` whose character was backslash-escaped in `source[start..end]`.
- `maskEscaped(value, indices)` / `unmaskEscaped(value)` — replace those characters with stand-ins no delimiter matches, and restore them.
- `maskTreeEscapes(tree, source)` — mask every positioned `text` node of a unist tree; returns a function that restores them.
