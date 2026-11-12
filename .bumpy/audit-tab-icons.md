---
"@mirrordown/mdit-tab-icons": patch
"@mirrordown/remd-tab-icons": patch
"@mirrordown/sat-tab-icons": patch
---

Fixes for labels whose `[!keyword]` marker sits next to other markup, and for the `icons` and `containerClass` options.

- **A marker followed by inline markup no longer repeats the label** (all engines).

  ```markdown
  % [!npm] **Install**
  > Body.
  ```

  Was the label `<svg…/>Install<strong>Install</strong>`. Now `<svg…/><strong>Install</strong>`. The same happened with a code span: ``% [!npm] `npm i` `` rendered `npm i<code>npm i</code>`.

- **A marker is read only at the start of the label's text** (all engines).

  ```markdown
  % **[!npm]** Install
  > Body.
  ```

  Was the label as written but the panel's `aria-label` cut down to `Install` (and in markdown-it an extra `Install` before the `<strong>`). Now the label as written with `aria-label="[!npm] Install"`; the label still gets the npm icon, matched by its text. The same goes for a marker in a code span, and for one split by emphasis (`[!n**p**m]`), which rendered `Install<strong>p</strong>m] Install`.

- **A marker whose keyword is a defined abbreviation is still a marker** (all engines), with the abbr plugin.

  ```markdown
  *[npm]: Node Package Manager

  % [!npm] Install
  > Body.
  ```

  Was the label `<svg…/>Install<abbr title="Node Package Manager">npm</abbr>] Install`. Now `<svg…/>Install`.

- **The markdown-it plugin honours `containerClass`.** It added icons to every tab group whatever the option said, where remark and Sätteri only touch groups that carry the class. If you give the tabs plugin a `containerClass`, pass the same value to tab-icons, in every engine: without it markdown-it now leaves those labels alone, as the other two always did.

- **An icon of yours wins a tie with a built-in keyword of the same length** (all engines), here with `icons: { cargo: … }`.

  ```markdown
  % cargo and react
  > Body.
  ```

  Was the built-in React icon. Now your `cargo` icon. A longer keyword still wins over a shorter one.

- **A key in `icons` replaces a built-in icon whatever its case** (all engines). With `icons: { NPM: … }`, a `[!npm]` marker got your icon while a label reading `npm` kept the built-in one; both now get yours.

- **Your SVG markup keeps its attributes** (all engines). An icon written with single-quoted attributes (`<svg viewBox='0 0 24 24'>`) or unquoted ones (`<svg width=24 height=24>`) lost them, and with them its size; they are now kept, written back in double quotes. A `>` inside an attribute value no longer cuts the tag short.

- **A self-closing `<svg … />` icon is closed** (all engines). It was written without its end, so the label's text became the icon's content; it is now `<svg …></svg>` followed by the label.

- **An icon whose markup does not start with `<svg` is refused when the plugin is created** (all engines). `icons: { cargo: '<img src="cargo.png" alt="">' }` used to be emitted as it was, without the icon's class or `aria-hidden`; it now throws a `TypeError` naming the key. A `{ light, dark }` pair missing one variant throws at the same point instead of at render.

- **The ids inside the built-in icons are named after the icon** (all engines). Icons that carry gradients or clip paths had short random ids such as `SVGgudELdDz`; they are now `markdown-tab-icon-<collection>-<name>-<n>`, so they cannot collide with another inline SVG on the page. An icon used twice in a document still repeats its ids, which the guide now says.
