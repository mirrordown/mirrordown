# Changelog


## 0.1.1
<sub>2026-11-03</sub>

- *(patch)*
  Show "Copy code" as the copy button's tooltip by default, in the pill its copied text already uses, so an icon-only button says what it does when hovered or focused. `text: { copy: null }` turns it off.

## 0.1.0
<sub>2026-11-02</sub>

- *(minor)*
  Add the copy-code plugin set: every fenced and indented code block gets a copy button, in its `<pre>` after the `<code>`, with no wrapper element. The button is an invoker command (`command="--copy"`) aimed at the `<pre>`, which takes an id from a hash of its code (`code-<hash>`, with `-2`, `-3`… for repeats). Each package ships a small client script (`./client`) that copies the block's code, without the newline markdown ends it with, shows a check with "Copied!" in a pill beside it, as GitHub does, and announces it to screen readers; the buttons render `hidden` until it runs, so a page without it shows none. The `icons` and `text` options set the button's icon and text in each state. Write `nocopy` after the fence's language to leave a block without one; a host that highlights first can keep the meta in a `data-meta` attribute on the `<pre>`. Where CSS anchor positioning with `anchor-scope` is supported, the button sits in the block's top corner and shows on hover or focus. The markdown-it, remark and Sätteri plugins emit identical HTML.
