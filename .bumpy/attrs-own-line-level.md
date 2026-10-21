---
"@mirrordown/mdit-attrs": minor
"@mirrordown/remd-attrs": minor
"markdown-attributes": minor
"markdown-preview-extended-syntax": patch
---

An attribute block on a line of its own now goes on the block it's written after, at the level its `>` markers and indentation put it, as kramdown places a block IAL. Written inside a blockquote or list item, it goes on the paragraph (`> para` then `> {.x}` gives `<p class="x">`), or on the item in a tight list (`- a` then `  {.x}` gives `<li class="x">`). Written outside one, as a lazy continuation line, it goes on that blockquote (`> para` then `{.x}`) or on the item's list (`- a` then `{.x}`), the outermost such block when it leaves several. Both plugins used to give the paragraph every line written inside a blockquote, and the list every line in a list item's first paragraph, whatever its indentation. markdown-it-attrs can't see indentation and gives the line to the outermost block ending with the paragraph; the cases where Mirrordown now differs from it are those where the indentation says otherwise. Inside tab panels and step bodies, the panel's own `>` belongs to the tab: a line written in the panel is placed as it would be at the top level.

An attribute block right after an inline element now applies when text follows it, as in markdown-it-attrs: `**important**{.warning} text.` gives `<strong class="warning">`, where both plugins kept the block as text unless it ended the text run. Blocks that follow one another merge (`` `npm i`{.cmd}{#install} ``). In `remd-attrs`, inline blocks are also read in headings, table cells and nested elements, and before the heading and list item rules, so `# Title **b**{.x}` gives the `strong` the class, as `mdit-attrs` does. `{.a} {#b}` is no longer read as one block holding `.a} {#b`: only the last block ends the paragraph.
