---
"@mirrordown/mdit-copy-code": patch
"@mirrordown/remd-copy-code": patch
"@mirrordown/sat-copy-code": patch
---

Fixes for the markdown-it plugin's handling of option text and of split parse and render calls, and for the client script; the markup for a code block with default options is unchanged.

- **Option text holding a `$` is written as it is** (markdown-it). With `text: { copy: "Copy $& all" }` the label pulled part of the code block's own HTML into the button (`aria-label="Copy </pre>…`), and `"Costs $$5"` came out as `Costs $5`. Both are now written as given, as in remark and Sätteri. The same goes for the `icons` option.

- **Buttons are added when tokens are rendered with a different `env` than they were parsed with** (markdown-it). `md.renderer.render(md.parse(src, {}), md.options, {})` rendered the code blocks without ids and without buttons; it now renders what `md.render(src)` does.

- **The client script does nothing when it is loaded a second time** (all engines). Loaded twice (from two of the packages, or again by a dev server), one press wrote the clipboard twice and the button kept the label "Copied!".

- **A button copies its own block when another element on the page has the block's id** (all engines). A heading whose slug equals a block's id (`code-…`), or the same block in a second document on the page, came first, and the button copied that element's text.

The guide now says that a block's id is unique per document rather than per page, and names file-tree beside mermaid-pele as a plugin to list before this one in remark and Sätteri.
