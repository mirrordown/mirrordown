# Changelog


## 0.1.1
<sub>2026-10-28</sub>

- *(patch)*
  Tab and step headers are placed by their `>` markers in remark and Sätteri, as markdown-it reads them. A header right after a paragraph, at its level, interrupts it and starts a group. A header written with a panel's or step body's own `>` is that panel's content: `% Tab` or `@1. Step` there starts a group inside it, and a nested header (`%%`, `@@`) with nothing to nest in stays text. Before, both became the next tab or step of the outer group.
- *(patch)*
  A line written without a tab panel's or step body's `>` right after the last panel now starts a paragraph after the group in remark and Sätteri, as markdown-it reads it, instead of continuing the panel's last paragraph (CommonMark's lazy continuation). The lines after it, and attributes ending them, go with it.

## 0.1.0
<sub>2026-10-28</sub>

- *(minor)*
  New `@mirrordown/sat-tabs`: tabbed content blocks (`% Label` with `>` bodies) for Sätteri, with the same output as `remd-tabs` and `mdit-tabs`, and included in `@mirrordown/preset-satteri` along with its stylesheet. Recognition is shared with `remd-tabs` through `@mirrordown/core`. A panel's `aria-label` is its label's text when tabs renders, so list `satteriTabs()` after the plugins for inline syntax (the preset does).
- *(minor)*
  Tab groups nested in step bodies and other containers work in every engine:

  - Block ids (the radio `name` and input ids) number the document's tab groups in the order they open, combined with the group id, instead of hashing a start line that nested groups don't reliably have. Two groups with the same labels in different steps shared radio names, so the first loaded with no panel open and the second's tabs switched the first. Ids of the first group on a page are unchanged; later groups' ids change. Core exports `tabsBlockId`, and `TabsListNode` no longer carries a `blockId`.
  - `mdit-tabs` keeps a group together across blank lines inside a container (a step body, tab panel, blockquote or list item) when another entry follows, as `remd-tabs` does: the empty `>` lines between entries are the container's own. At the top level a blank line still ends a group.
- *(patch)*
  A tab header written right after nested tab content (`> > Option C body.` then `% Code`) starts a tab in the outer group in every engine. CommonMark lazily continues the nested paragraph with it, so the remark and Sätteri plugins put it in the inner group (the tabs guide's own "Default open tab" demo showed `Code` beside `Option C`); they now read the source's `>` markers as markdown-it does, keeping the header at the depth it was written with and the blockquote structure of the lines after it. `processTabs` takes the document's source for this; the marker handling is shared with steps.
- *(patch)*
  A tab header that skips a level no longer loses content in the remark and Sätteri plugins, which dropped it and its body; they now render it as `mdit-tabs` does. In a tab's explicit `> %` body it stays in that panel as text, after any group nested there; in a group of plain `>` bodies it ends the group, and it and the lines after it follow the group as ordinary content, with the blockquotes their `>` markers give. A panel's content now also renders in document order in both plugins, rather than its body before its nested groups.
- *(patch)*
  Paragraphs in tab panels and step bodies keep what they had when recognition splits them around a header:

  - A hard break (`line\` then `more`) stays a `<br>` in `remd-tabs`, `remd-steps`, `sat-tabs` and `sat-steps`; it became a plain line break, unlike in `mdit-tabs` and `mdit-steps`.
  - Text split around a header keeps its source position, and the lines left together are one text node again, as remark gives them.
  - In `sat-tabs` and `sat-steps`, a paragraph keeps the attributes Sätteri read from its end. A header right after a panel's last paragraph continues that paragraph in CommonMark, so Sätteri saw the paragraph's attribute block mid-paragraph; with Sätteri's `attributes` feature on, the plugins now place that block once the header is split off, where Sätteri would have.
  - `mdit-tabs` and `mdit-steps` give the panel's opening token its body as `meta.attrsSource`, since the tokens inside index the body's lines, so `mdit-attrs` can read a line's indentation there.
- *(patch)*
  Sätteri 0.11 reads attribute blocks and definition lists the way Mirrordown's other engines do, so the Sätteri suite now covers every feature:

  - `preset-satteri` has `attrs` and `definitionList` options, on by default like the other presets, which turn on Sätteri's own `attributes` and `definitionList` features. With them, the preset renders every shared fixture as `preset-remark` and `preset-markdown-it` do.
  - The `sat-*` packages accept Sätteri 0.11 as well as 0.10 (`^0.10.5 || ^0.11.0`); Astro's Sätteri integration is still on 0.10, where the plugins work as before.
  - An attribute block ending a tab or step header (`% Tab {.tab}`, `@1. Step {.step}`) now goes on the item in `sat-tabs` and `sat-steps`, as in the other engines: Sätteri read it off the header's paragraph before recognition, and the item didn't get it.
  - `sat-ruby` parses a ruby's base and reading with the document's features, which Sätteri 0.11.3 and later tell plugins; its `features` option is only needed with an older Sätteri.
