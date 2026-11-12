---
"@mirrordown/core": minor
---

New exports for plugins that split text or place attribute blocks on spans, and fixes to the shared recognition every Mirrordown plugin for remark and Sätteri is built on.

New exports, all from the package root:

- `textEscapes(node, source, parentType?, only?, inTableCell?)` returns the indices of a text node's characters that are literal: escaped with a backslash or written as a character reference. It reads them from the node's position in `source`, or from the record a previous scan left on a node it rebuilt.
- `carryEscapes(piece, escaped, from)` records on a text node you built from part of another one which of its characters were escaped, so a span scan that runs after your plugin still tells `\==` from `==`. Call it for each piece when your plugin splits a text node itself.
- `scanSpans(transform, parent, host)` runs a span transform over the children of a node in a read-only tree (Sätteri's) and writes the result back through `host`. It finds an enclosing table cell however far up, where `\|` is a pipe and not an escape, and lets each span take the attribute block written right after it. `SpanHost` and `SpanParent` are its types.
- `createAttributeReader(markdownToMdast)` builds a reader of `{…}` attribute blocks from Sätteri's own parser, so a plugin reads a block exactly as the parser does.
- `leadingAttributes(value, read)` returns the attribute blocks a text opens with and the text left after them.
- `claimTrailingAttributes(written, parentType, holders, read)` takes back the block the parser read off the end of a paragraph, list item or heading when it was written touching a span your plugin built (`--x--{.cls}` rather than `--x-- {.cls}`).
- `addProperties(node, properties)` adds properties to those a built node renders with: classes join the node's own, other attributes replace them.

Changes to existing exports:

- **Span transforms** (`createDelimitedTransform`, `createKbdTransform`, and anything run through `SpanTransform`): an escaped character or a character reference stays literal through every scan, not only the first; the text of an autolink (`<https://example.com/--a-->`) is not scanned; the characters beside a delimiter run are classified as markdown-it classifies them; Private Use characters an author typed are no longer rewritten; pairs nested deeper than 100 stay text (`createDelimitedTransform` takes an optional `maxDepth`); and the key scan takes linear time on a line of unclosed `[[`. `createKbdTransform` now lays out a link whose opening bracket is half of a `[[`, so its node type must include links, and `Positioned` now includes `data`.
- **`maskEscaped`** also masks stand-in characters already in the value, so `unmaskEscaped` gives back exactly the text that went in.
- **`processSteps`, `processTabs` and `processCaptions`** read CRLF and lone CR line endings and place each line by the source line it is written on, so a header or caption after emphasis or a code span that spans lines is found. Steps and tabs also end a group at a line that is neither a header nor a `>` line wherever it is written, and leave an escaped header as text. `processStepsInChildren` and `processTabsInChildren` take an optional `column`, the column a list item's content starts at.
- **`TabsListNode`** has a new required field, `blockId`, which `processTabs` sets in document order; read it instead of counting groups yourself. A `stepsItem` or `tabsItem` written with `@@` or `%%` carries `data.sub: true`.
- **`createAbbreviationScan` and `parseAbbreviations`** match a term between the same boundaries as markdown-it, read definitions from the document's source (so a title may hold another plugin's syntax), and reject a blank term or title.
- **`lightboxDialog`** writes no caption element for a caption that is empty or only whitespace; its type parameter is now `C extends HastLike`.
- **`mermaidSvg`** keeps single-quoted, unquoted and value-less attributes of the tag it rewrites, closes a self-closing root, and reads a `>` inside an attribute value as part of the value. **`mermaidDiagram`** takes the last `language-…` class of a `<code>` as its language.
- **`inlineSvgMarkup`** inserts alt text holding `$` as written, labels a self-closing root before its slash, and with deduplication puts the root's other attributes on each reference.
- **`createAlertResolver`** no longer resolves a keyword that names a member every object inherits (`constructor`), and matches `types` keys written with capitals; the `titles` option's type accepts a custom type's name. **`splitAlertParagraph`** takes the document's source as an optional second argument, with which an escaped marker is not a marker, and ends the title only at a line break outside inline markup.
- **`@mirrordown/core/tab-icons`**: the resolver `createTabIconResolver` returns is called as `(label, lead?)`, where `lead` is the label's leading text, and reads a marker only when that text starts with it. Creating a resolver throws a `TypeError` for an icon whose markup does not start with `<svg`. Keys in `icons` are merged without regard to case, and yours are tried before built-in keywords of the same length.
- **`@mirrordown/core/file-tree`**: `fileTreeIcon` looks up only a table's own keys, so a file named `constructor` gets the icon of an unknown file instead of throwing, and `parseFileTree` reads a long line in linear time.
- **`@mirrordown/core/prompt`**: `promptServiceTarget` fills in a prompt holding `$$` or `$&` as written.
