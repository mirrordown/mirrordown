# Changelog



## 0.1.2
<sub>2026-10-28</sub>

- *(patch)*
  Add the tab-icons plugin set, a port of vitepress-plugin-group-icons for Mirrordown's tabs: each tab label gets the icon its text matches (a keyword such as `npm`, `pnpm` or `vite` as a whole word, the longest winning, else a file name or extension such as `package.json` or `.ts`), or the one a `[!keyword]` marker at its start names; `[!none]` turns matching off for one label. The icon is an inline `<svg class="markdown-tab-icon" aria-hidden="true">` before the label's text, and the marker comes out of the label and its panel's `aria-label`. It ships group-icons' built-in icons (from VSCode Icons and SVG Logos); the `icons` option adds or replaces them, with light and dark pairs, and `builtin` and `match` turn the built-in icons and matching off. The markdown-it, remark and Sätteri plugins emit identical HTML.

## 0.1.1
<sub>2026-10-28</sub>

- *(patch)*
  Add the mermaid-pele plugin set: ` ```mermaid ` code blocks render to inline SVG at build time with [Pele](https://pele.run), so diagrams need no JavaScript on the page and no headless browser in the build, and they render in VSCode's preview. The API follows rehype-mermaid's (`prefix`, `errorFallback`, Mermaid `config` as `config`), with Pele's render options passed through; a diagram that fails to render fails the build at its line unless `errorFallback` handles it. Each diagram's ids are prefixed with a hash of its source (and a count for repeats), attributes on the fence (`{#id .class}`) go on the `<svg>`, and the stylesheet themes Pele's CSS variables from the page's `color-scheme`. The markdown-it, rehype and Sätteri plugins emit identical HTML.
- *(patch)*
  Add the caption plugin set: a `~:` line written right after a block captions it, wrapping the block in `<figure class="markdown-caption">` with a `<figcaption>`. Any block can take a caption (an image, paragraph, quote, code, table, list, or the containers other plugins add); a heading, thematic break, raw HTML or another caption can't. An image alone in its paragraph becomes the figure's content, and its alt text stays its alt text. The caption runs to the end of its paragraph and holds inline markdown; the `>` markers and indentation a caption line is written with decide which block it captions, as attrs places a line of attributes, and attributes ending a caption go on the figure. The markdown-it, remark and Sätteri plugins emit identical HTML.
- *(patch)*
  Tab and step headers are placed by their `>` markers in remark and Sätteri, as markdown-it reads them. A header right after a paragraph, at its level, interrupts it and starts a group. A header written with a panel's or step body's own `>` is that panel's content: `% Tab` or `@1. Step` there starts a group inside it, and a nested header (`%%`, `@@`) with nothing to nest in stays text. Before, both became the next tab or step of the outer group.
- *(patch)*
  A line written without a tab panel's or step body's `>` right after the last panel now starts a paragraph after the group in remark and Sätteri, as markdown-it reads it, instead of continuing the panel's last paragraph (CommonMark's lazy continuation). The lines after it, and attributes ending them, go with it.
- *(patch)*
  An alert (`> [!NOTE]`) after a step, with a blank line between, is now a block of its own after the steps in every engine, whether or not the alerts plugin reads it. A plain quote there still continues the last step's body. markdown-it took the alert into the body as text, and remark into the body without its title.
- *(patch)*
  Captioned lightbox images: a lightbox image (`!![alt](src)`) followed by a `~:` caption is now the figure's content, so its trigger sits directly in the `<figure>` without unwrap-images. The lightbox plugins take a `caption` option (off by default) that shows a captioned image's caption under it in the dialog; repeated images share one dialog, which shows the first caption any of them has. The presets pass lightbox options through (`lightbox: { caption: true }`). The lightbox READMEs are now generated from its guide.

## 0.1.0
<sub>2026-10-28</sub>

- *(minor)*
  Backslash-escaped delimiters are now literal in `remd-mark`, `remd-ins`, `remd-del`, `remd-kbd`, `remd-spoiler`, `remd-sub` and `remd-sup`, as they already were in the `mdit-*` plugins: `\==not marked==` renders as `==not marked==` instead of a `<mark>`, while an escaped backslash (`\==marked==`) still allows the markup. These plugins now depend on the new `@mirrordown/core` package, which holds logic shared across Mirrordown's engines.
- *(minor)*
  `mdit-github-alerts` and `remd-github-alerts` now share their alert keywords, default titles, icons, option resolution and (for remark and Sätteri) the marker-line rule through `@mirrordown/core`, instead of keeping duplicate copies. Their output and public exports are unchanged.
- *(minor)*
  `remd-mark` now runs its `==mark==` scan through `createDelimitedTransform` and `MARK_DELIMITERS` from `@mirrordown/core`, which the Sätteri plugin shares, and drops its `unist-util-find-*` and `unist-builder` dependencies. Its output is unchanged.
- *(minor)*
  `~subscript~` and `^superscript^` now parse the same way in markdown-it, remark and Sätteri: a single `~` or `^` is a delimiter run with emphasis-style flanking, its content is inline markup (spaces, emphasis, links, code and each other), and crossing runs resolve leftmost-first.

  - `mdit-sub` and `mdit-sup` used to keep the content as plain text and reject any space inside it. They now parse it as inline markup, so `~*a* b~` renders emphasis and `^a~b~c^` nests.
  - `remd-sub` and `remd-sup` are now micromark syntax extensions sharing one resolver from `@mirrordown/core` (`scriptSyntax`), instead of text scans run one after another. Crossing runs such as `^a~b^c~` no longer depend on which plugin was registered first, `~~a~~` without GFM is no longer turned into empty subscripts, and the packages drop their `unist-util-*` dependencies.
  - The sub guide now shows `remark-gfm` with `singleTilde: false`: GFM's single-tilde strikethrough, which Astro enables by default, otherwise claims `~text~` first.
- *(minor)*
  `==mark==`, `++ins++` and `--del--` now pair delimiters the same way in every engine. `@mirrordown/core`'s `createDelimitedTransform` ports markdown-it's delimiter algorithm (the one markdown-it-mark and markdown-it-ins use), and the remark and Sätteri plugins run on it:

  - A closer pairs with the nearest opener: `==a ==b==` highlights only `b`, as markdown-it does.
  - Spans nest: `==a ==b== c==` is a highlight inside a highlight.
  - The extra marker of an odd-length run stays outside the span (`===a===` → `=<mark>a</mark>=`); `mdit-del` compared against `+` instead of `-` here, so its marker ended up inside.
  - `remd-del` no longer mishandles runs such as `--a --- b--` or `--+a+--`, which came from patterns copied from the ins plugin.

  New Sätteri plugins `@mirrordown/sat-ins` and `@mirrordown/sat-del`, also included in `@mirrordown/preset-satteri`. The `del` guide notes that smart punctuation, on by default in Astro, turns `--` into an en dash before the plugin runs.
- *(minor)*
  `[[key]]` now scans the same way in every engine. `@mirrordown/core`'s new `createKbdTransform` ports markdown-it-kbd's tokenizer, and `remd-kbd` and the new `@mirrordown/sat-kbd` run on it:

  - Keys nest: `[[a [[b]] c]]`.
  - A single `]` stays inside a key: `[[a]b]]`.
  - A line ending before the closing `]]` cancels the key even when formatting sits in between.
  - `[[[a]]` keeps the extra `[` outside the key.

  `remd-kbd` drops its `unist-util-find-*` and `unist-builder` dependencies. One difference is inherent to the engines and documented in the guide: markdown-it reads `[[*a]]*` as a key, while remark and Sätteri have already read the emphasis.

  `@mirrordown/sat-kbd` is included in `@mirrordown/preset-satteri`.
- *(minor)*
  `||spoiler||` now pairs delimiters with markdown-it's rules in every engine: `remd-spoiler` runs on `@mirrordown/core`'s delimiter scan (which gains the `|` marker), so a closer pairs with the nearest opener, spoilers nest, and an odd-length run's extra `|` stays outside; it drops its `unist-util-find-*` and `unist-builder` dependencies.

  New `@mirrordown/sat-spoiler` renders the same JavaScript-free click-to-reveal markup, ships the same stylesheet, and is included in `@mirrordown/preset-satteri`.
- *(minor)*
  Sätteri ports of the hast plugins: `@mirrordown/sat-squeeze-paragraphs`, `sat-unwrap-images`, `sat-sectionize`, `sat-lightbox` and `sat-autolink-headings`, all included in `@mirrordown/preset-satteri` (whose stylesheet now also imports the lightbox and autolink-headings styles). Their output is identical to the markdown-it and rehype plugins'. `sat-autolink-headings` takes the same options as `remd-autolink-headings`, including the hast-node ones (`content`, `group`, `properties`, `headingProperties`, `test`).

  The rules these engines must compute identically move into `@mirrordown/core` (`isEmptyParagraph`, `isImageParagraph`, `sectionize`, `headingRank`, and the lightbox's marker, ids and markup), which the rehype plugins now use too; their output is unchanged, and squeeze-paragraphs and unwrap-images drop `hast-util-whitespace`.
- *(minor)*
  New `@mirrordown/sat-abbr`: abbreviations (`*[term]: definition`) for Sätteri, with the same output as `remd-abbr` and `mdit-abbr`, and included in `@mirrordown/preset-satteri`. The definition and term rules move into `@mirrordown/core` (`parseAbbreviations`, `createAbbreviationScan`), which `remd-abbr` now uses too; its output is unchanged.
- *(minor)*
  New `@mirrordown/sat-steps`: numbered step sequences (`@1. Title` with `>` bodies) for Sätteri, with the same output as `remd-steps` and `mdit-steps`, and included in `@mirrordown/preset-satteri` along with its stylesheet. Step recognition moves into `@mirrordown/core` (`processSteps`), which `remd-steps` now uses too; its output is unchanged.
- *(minor)*
  Tab labels behave the same in every engine:

  - `remd-tabs` keeps a tab's label in the tree, as a `tabsLabel` node that is the first child of each `tabsItem` (the `label` field is gone), so remark plugins that run after it also apply to the label, and a panel's `aria-label` is the label's final text.
  - `data-tabs-group` hashes each label's plain text without a trailing attrs block, as the tabs specification describes. `mdit-tabs` hashed the raw markdown, so labels with links, images, entities or escapes got different ids in markdown-it and remark; labels with a trailing `{…}` change id in both.
  - `mdit-tabs` escapes a panel's `aria-label` once: `npm & yarn` rendered as `aria-label="npm &amp;amp; yarn"`.
  - `mdit-tabs` nests its panel tokens inside the tabs tokens, so `mdit-sectionize` no longer opens a `<section>` around a heading in a tab panel that closed outside the panel.
- *(minor)*
  `@mirrordown/sat-steps` writes back only the parts of the tree that step recognition changed, through core's new `editableTree`, so every node it leaves alone stays Sätteri's own and keeps its source position for the plugins after it (tabs reads positions to end a group at a blank line). It also recognizes a step header directly after a list marker (`- @1. Step`), as the remark and markdown-it plugins do.
- *(minor)*
  A step header written right after nested content (`> > Quoted.` then `@2. Next`) starts the next step in every engine. CommonMark lazily continues the nested paragraph with it, so the remark and Sätteri plugins rendered the header as text inside the previous step; they now read the source's `>` markers as markdown-it does, recovering the header and the blockquote structure of the lines after it. `processSteps` takes the document's source for this.
- *(minor)*
  Tab groups nested in step bodies and other containers work in every engine:

  - Block ids (the radio `name` and input ids) number the document's tab groups in the order they open, combined with the group id, instead of hashing a start line that nested groups don't reliably have. Two groups with the same labels in different steps shared radio names, so the first loaded with no panel open and the second's tabs switched the first. Ids of the first group on a page are unchanged; later groups' ids change. Core exports `tabsBlockId`, and `TabsListNode` no longer carries a `blockId`.
  - `mdit-tabs` keeps a group together across blank lines inside a container (a step body, tab panel, blockquote or list item) when another entry follows, as `remd-tabs` does: the empty `>` lines between entries are the container's own. At the top level a blank line still ends a group.
- *(minor)*
  New `@mirrordown/sat-inline-svg`: inlines referenced local `.svg` images as `<svg>` elements in Sätteri, resolving them against the `fileURL` compile option, with the same output as `mdit-inline-svg` and `remd-inline-svg`. The size limits, deduplication and markup move into `@mirrordown/core` (`inlineSvgMarkup`, `svgSpriteId`), which the markdown-it and rehype plugins now use too; their output is unchanged. Like the other presets, `@mirrordown/preset-satteri` leaves it out because it reads files from disk.
- *(minor)*
  A tab header written right after nested tab content (`> > Option C body.` then `% Code`) starts a tab in the outer group in every engine. CommonMark lazily continues the nested paragraph with it, so the remark and Sätteri plugins put it in the inner group (the tabs guide's own "Default open tab" demo showed `Code` beside `Option C`); they now read the source's `>` markers as markdown-it does, keeping the header at the depth it was written with and the blockquote structure of the lines after it. `processTabs` takes the document's source for this; the marker handling is shared with steps.
- *(minor)*
  A tab header that skips a level no longer loses content in the remark and Sätteri plugins, which dropped it and its body; they now render it as `mdit-tabs` does. In a tab's explicit `> %` body it stays in that panel as text, after any group nested there; in a group of plain `>` bodies it ends the group, and it and the lines after it follow the group as ordinary content, with the blockquotes their `>` markers give. A panel's content now also renders in document order in both plugins, rather than its body before its nested groups.
- *(patch)*
  `@mirrordown/core` declares `"sideEffects": false`, so bundlers drop the parts a plugin doesn't import (the escape helpers, the sub/sup micromark syntax) without having to prove them unused.
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
