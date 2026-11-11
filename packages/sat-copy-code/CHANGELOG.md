# Changelog



## 0.2.0
<sub>2026-11-11</sub>

- *(minor)*
  Require Sätteri 0.11.3 or later, which Astro ships from 7.4.7 (`@astrojs/markdown-satteri` 0.4.7). The plugins now read the document's features from Sätteri itself, so in Astro `satteriRuby()` needs no `features` passed to it, and tabs and steps no longer allow for a Sätteri that passes none. On Astro 7.4.6 or earlier, update Astro first.

## 0.1.1
<sub>2026-11-03</sub>

- *(patch)*
  Show "Copy code" as the copy button's tooltip by default, in the pill its copied text already uses, so an icon-only button says what it does when hovered or focused. `text: { copy: null }` turns it off.

## 0.1.0
<sub>2026-11-02</sub>

- *(minor)*
  Add the copy-code plugin set: every fenced and indented code block gets a copy button, in its `<pre>` after the `<code>`, with no wrapper element. The button is an invoker command (`command="--copy"`) aimed at the `<pre>`, which takes an id from a hash of its code (`code-<hash>`, with `-2`, `-3`… for repeats). Each package ships a small client script (`./client`) that copies the block's code, without the newline markdown ends it with, shows a check with "Copied!" in a pill beside it, as GitHub does, and announces it to screen readers; the buttons render `hidden` until it runs, so a page without it shows none. The `icons` and `text` options set the button's icon and text in each state. Write `nocopy` after the fence's language to leave a block without one; a host that highlights first can keep the meta in a `data-meta` attribute on the `<pre>`. Where CSS anchor positioning with `anchor-scope` is supported, the button sits in the block's top corner and shows on hover or focus. The markdown-it, remark and Sätteri plugins emit identical HTML.
