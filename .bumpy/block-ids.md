---
"@mirrordown/mdit-block-ids": minor
"@mirrordown/remd-block-ids": minor
"@mirrordown/sat-block-ids": minor
"@mirrordown/core": minor
"@mirrordown/remd-github-alerts": patch
---

Add the block-ids plugin set: an Obsidian block identifier, `^` and a name at the end of a block, is removed from the text and becomes the block's HTML `id`, so a link to `#^name` finds it in a browser.

- **A marker at the end of a paragraph names the paragraph** (all engines). It also names it from a last line of its own.

  ```markdown
  The quick purple gem dashes through the paragraph. ^37066d
  ```

  Was `<p>The quick purple gem dashes through the paragraph. ^37066d</p>`. Now `<p id="^37066d">The quick purple gem dashes through the paragraph.</p>`. The `id` keeps the caret: it is the fragment Obsidian writes, and a heading's slug never has one, so the two cannot collide.

- **In a list item it names the item, in a quote or an alert the outermost quote or alert, and at the end of a heading the heading** (all engines).

  ```markdown
  - Gemmy ^item-1

  ## Setup ^setup
  ```

  Renders `<ul><li id="^item-1">Gemmy</li></ul>` and `<h2 id="^setup">Setup</h2>`. With the slug plugin the heading keeps the marker's id, as it keeps one written as `{#name}`, and that heading's slug is not counted as used.

- **Alone in its own paragraph it names the block before it** (all engines): a list, a table, a code block, a quote, an alert, a tab group. The marker's paragraph is removed.

  ```markdown
  - list item 1
  - list item 2

  ^my-list
  ```

  Was `<ul>…</ul><p>^my-list</p>`. Now `<ul id="^my-list"><li>list item 1</li><li>list item 2</li></ul>`. With no block before it, the marker is removed and names nothing, as in Obsidian.

- **Only a marker written as plain text at the very end counts.** It needs a space, a tab or a line start before it and nothing after it, and its name is letters, digits and hyphens. `E = mc^2`, `not-a-marker^abc`, `\^abc`, `*x ^abc*` and a marker followed by a space are text. This is stricter than Obsidian, which also reads `x\[^1` and `*^blk*` as naming a block.

- **Each element has one id and each identifier one element.** Two markers on one element: the last is its id. One identifier on two blocks: the last block keeps it, as Obsidian resolves a duplicate. An id written with the attrs plugin (`{#name}`) wins over a marker, which is then only removed.

- **Order matters in remark and Sätteri.** List the plugin after tabs and steps (and, in remark, after attrs): before they run, a tab panel's body is still a plain quote, and a marker in it would name that quote. The presets do this.

Known cost: a paragraph, heading or list item cannot end in a space and `^word`. `Stop it with ^C` loses `^C` and gets `id="^C"`; write it as code (`` `^C` ``) to keep it.

`@mirrordown/remd-github-alerts`: an alert's title node records the title its options give the type (`data.defaultTitle`), so `> [!note] ^blk`, whose title was only a marker, is titled by the `titles` option in remark as in the other engines. No output changes on its own.

`@mirrordown/core` gains `processBlockIds`, `resolveBlockIds`, `trailingMarker`, `cutMarker`, `trimBlankEnd`, `blankAfterMarker`, `titleMarkerWritten` and the `BlockIdEdits` and `BlockMarker` types.
