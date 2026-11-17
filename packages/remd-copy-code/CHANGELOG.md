# Changelog



## 0.1.2
<sub>2026-11-17</sub>

- *(patch)*
  Fixes for the markdown-it plugin's handling of option text and of split parse and render calls, and for the client script; the markup for a code block with default options is unchanged.

  - **Option text holding a `$` is written as it is** (markdown-it). With `text: { copy: "Copy $& all" }` the label pulled part of the code block's own HTML into the button (`aria-label="Copy </pre>…`), and `"Costs $$5"` came out as `Costs $5`. Both are now written as given, as in remark and Sätteri. The same goes for the `icons` option.

  - **Buttons are added when tokens are rendered with a different `env` than they were parsed with** (markdown-it). `md.renderer.render(md.parse(src, {}), md.options, {})` rendered the code blocks without ids and without buttons; it now renders what `md.render(src)` does.

  - **The client script does nothing when it is loaded a second time** (all engines). Loaded twice (from two of the packages, or again by a dev server), one press wrote the clipboard twice and the button kept the label "Copied!".

  - **A button copies its own block when another element on the page has the block's id** (all engines). A heading whose slug equals a block's id (`code-…`), or the same block in a second document on the page, came first, and the button copied that element's text.

  The guide now says that a block's id is unique per document rather than per page, and names file-tree beside mermaid-pele as a plugin to list before this one in remark and Sätteri.

## 0.1.1
<sub>2026-11-03</sub>

- *(patch)*
  Show "Copy code" as the copy button's tooltip by default, in the pill its copied text already uses, so an icon-only button says what it does when hovered or focused. `text: { copy: null }` turns it off.

## 0.1.0
<sub>2026-11-02</sub>

- *(minor)*
  Add the copy-code plugin set: every fenced and indented code block gets a copy button, in its `<pre>` after the `<code>`, with no wrapper element. The button is an invoker command (`command="--copy"`) aimed at the `<pre>`, which takes an id from a hash of its code (`code-<hash>`, with `-2`, `-3`… for repeats). Each package ships a small client script (`./client`) that copies the block's code, without the newline markdown ends it with, shows a check with "Copied!" in a pill beside it, as GitHub does, and announces it to screen readers; the buttons render `hidden` until it runs, so a page without it shows none. The `icons` and `text` options set the button's icon and text in each state. Write `nocopy` after the fence's language to leave a block without one; a host that highlights first can keep the meta in a `data-meta` attribute on the `<pre>`. Where CSS anchor positioning with `anchor-scope` is supported, the button sits in the block's top corner and shows on hover or focus. The markdown-it, remark and Sätteri plugins emit identical HTML.
