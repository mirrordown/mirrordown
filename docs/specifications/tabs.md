# Tabs Plugin Specification

## Overview

The tabs plugin renders a set of switchable content panels using a pure HTML + CSS
approach based on `<details>`/`<summary>`. No JavaScript is shipped with the plugin.
Cross-block synchronization is supported as an optional consumer-supplied progressive
enhancement via stable data attributes.

---

## Syntax

### Tab header line

```
% Label Text
```

- Must start at column 0
- `%` followed by a single space, then the label text (any inline markdown)
- Label text is parsed as inline content
- A `+` immediately after `%` marks that tab as the explicitly open tab:
  `%+ Label Text`
- If no tab is marked with `+`, the first tab in the block is open by default
- Only one tab per block may be marked open; if multiple are marked, the first wins

### Continuation lines

```
> content here
```

- Standard blockquote marker `>`, optionally followed by a space
- Parsed as block content (paragraphs, code fences, nested tabs, etc.)
- A bare `>` with no content is a blank continuation line — it preserves a paragraph
  break within the panel body and keeps the block open

### Block grouping and termination

Tabs are grouped by adjacency. A new `%` header line (at any depth) appearing
immediately after `>` continuation lines (with no intervening blank line) continues
the same tab group. The group ends when the next line is neither a `%` header
(at any `%` count) nor a `>` continuation.

**Valid group** — no blank lines between tabs:

```markdown
% Tab One

> Content for tab one.
> % Tab Two
> Content for tab two.
```

**Terminated group** — blank line before non-tab content ends the block:

```markdown
% Tab One

> Content for tab one.

This paragraph is outside the tab group.
```

A blank line between the last continuation line and a subsequent `%` header would
also terminate the group and start a new one.

Inside a container (a step body, another tab's panel, a blockquote or a list item), a blank line between a group's entries is the container's own (an empty `>` line, as in `> % npm` … `>` … `> % yarn`), so it does not end the group: the group goes on when the next non-blank line is a `%` header or a `>` continuation, and ends otherwise.

### Basic example

````markdown
% npm

> ```sh
> npm install my-package
> ```
>
> %+ pnpm
>
> ```sh
> pnpm add my-package
> ```
>
> % yarn
>
> ```sh
> yarn add my-package
> ```
````

In this example the `pnpm` tab is explicitly set as the open tab.

---

## Nesting

Nesting follows the same depth-encoding convention as the `steps` plugin: the number
of `%` characters determines the nesting level. A depth-1 tab block uses `%`; a
depth-2 block nested inside a panel uses `%%`; and so on up to six levels (`%%%%%%`).

Nested `%%` header lines appear directly after a parent `%` header or after `>`
continuation lines belonging to that parent panel. The `>` continuation lines that
follow a `%%` header are the panel body of that nested tab. Returning to a shallower
depth closes the nested block and continues the parent.

A bare `>` line between nested tab headers acts as a blank continuation, keeping the
nested block open across a visual gap.

````markdown
% Node.js
%% npm

> ```sh
> npm install
> ```
>
> %% pnpm
>
> ```sh
> pnpm add
> ```
>
> % Deno
>
> ```sh
> deno add my-package
> ```
````

The depth increment between a parent panel and its nested tab block must be exactly
one (no depth jumps). A `%%%` block may only appear inside a `%%` panel.

---

## Rendering

### Container element

```html
<div class="markdown-tabs" data-tabs-group="{group-id}" aria-label="Tabs">
  <!-- one <details> per tab -->
</div>
```

- `data-tabs-group` — a content-based identifier derived from the sorted, lowercased,
  slugified tab labels joined with `-`. Two tab blocks whose label sets are identical
  (regardless of order or page position) produce the same `data-tabs-group` value.
  This is the stable public API hook for optional JS cross-block sync.
- `aria-label="Tabs"` — announces the container as a tab group to screen readers.
  When a custom label is supplied via attrs (e.g. `{aria-label="Package manager"}`),
  the custom value takes precedence.

### Per-tab element

```html
<details class="markdown-tabs-item" name="{block-id}" data-tab="{slug}">
  <summary class="markdown-tabs-label" aria-label="{label text}">
    {label inline content}
  </summary>
  <section class="markdown-tabs-panel" aria-label="{label text}">
    {panel block content}
  </section>
</details>
```

- `name="{block-id}"` — all `<details>` within the same block share this value.
  Browsers use a shared `name` to enforce exclusive-open behavior (at most one
  `<details>` with that name open at a time), equivalent to a radio group. The value
  is derived from a hash of the label set combined with the block's source position,
  ensuring uniqueness across blocks even when label sets are identical.
- `data-tab="{slug}"` — the slugified label text (e.g. `"My Tab"` → `"my-tab"`).
  This is the cross-block sync key consumed by optional JS.
- The tab designated as open (explicitly via `%+`, or the first tab by default)
  receives the `open` attribute.
- `aria-label` on `<summary>` — explicitly names the control for screen readers,
  matching the visible label text as a plain string (inline markup stripped).
- `<section>` for the panel body — carries the implicit `role="region"` without a
  redundant `role` attribute. Becomes a named landmark when paired with `aria-label`,
  allowing screen readers to surface each panel in the landmarks list and announce its
  label on entry. `<section>` is the correct semantic fit for a thematically grouped,
  named region of arbitrary content; the outer container remains a `<div>` since no
  native element maps to "tab group".

### Accessibility notes

The native `<details>`/`<summary>` element pair provides baseline accessibility
without JavaScript: `<summary>` is natively focusable, keyboard-activatable (Enter
and Space), and communicates expanded/collapsed state. Each `<section>` panel becomes
a named landmark via its `aria-label`, surfaced in screen reader landmark navigation
without requiring an explicit `role` attribute. This is functional but does not fully
satisfy the ARIA tabs pattern (`role="tablist"`, `role="tab"`, `role="tabpanel"`,
`aria-selected`), which requires dynamic `aria-selected` updates that depend on JS.

The optional JS sync layer (see below) is also the appropriate place to apply full
ARIA tab semantics if desired. The `data-tab` and `data-tabs-group` attributes provide
the necessary hooks.

### Full example output

````markdown
% npm

> ```sh
> npm install my-package
> ```
>
> %+ pnpm
>
> ```sh
> pnpm add my-package
> ```
>
> % yarn
>
> ```sh
> yarn add my-package
> ```
````

```html
<div class="markdown-tabs" data-tabs-group="npm-pnpm-yarn" aria-label="Tabs">
  <details class="markdown-tabs-item" name="tabs-a1b2c3" data-tab="npm">
    <summary class="markdown-tabs-label" aria-label="npm">npm</summary>
    <section class="markdown-tabs-panel" aria-label="npm">
      <pre><code class="language-sh">npm install my-package</code></pre>
    </section>
  </details>
  <details class="markdown-tabs-item" name="tabs-a1b2c3" data-tab="pnpm" open>
    <summary class="markdown-tabs-label" aria-label="pnpm">pnpm</summary>
    <section class="markdown-tabs-panel" aria-label="pnpm">
      <pre><code class="language-sh">pnpm add my-package</code></pre>
    </section>
  </details>
  <details class="markdown-tabs-item" name="tabs-a1b2c3" data-tab="yarn">
    <summary class="markdown-tabs-label" aria-label="yarn">yarn</summary>
    <section class="markdown-tabs-panel" aria-label="yarn">
      <pre><code class="language-sh">yarn add my-package</code></pre>
    </section>
  </details>
</div>
```

---

## Plugin options

| Option           | Type     | Default           | Description                        |
| ---------------- | -------- | ----------------- | ---------------------------------- |
| `containerClass` | `string` | `"markdown-tabs"` | Class applied to the outer `<div>` |

Derived class names follow the BEM-like pattern used across this plugin set:

| Element                      | Class                    |
| ---------------------------- | ------------------------ |
| Outer container (`<div>`)    | `{containerClass}`       |
| Individual tab (`<details>`) | `{containerClass}-item`  |
| Tab label (`<summary>`)      | `{containerClass}-label` |
| Tab panel body (`<section>`) | `{containerClass}-panel` |

---

## Styling strategy

### Principles

The stylesheet follows the same conventions established by the github-alerts CSS:

- All rules live inside a named `@layer` (`markdown-tabs`) so any unlayered consumer
  CSS overrides them without `!important`
- Color tokens use `light-dark()` so they respond to the nearest `color-scheme`
  ancestor without media queries
- Colors are expressed in OKLCH for perceptually uniform lightness across hues
- Private tokens use the `--_` prefix convention; public override tokens use
  `--markdown-tabs-*`
- Element targeting prefers attribute selectors and native element selectors over
  class names wherever possible, reducing coupling to the generated markup
- Native CSS nesting is used throughout to keep related rules co-located

### Layout

The tab group uses CSS grid with subgrid to align the tab strip and panels:

```css
@layer markdown-tabs {
  .markdown-tabs {
    --_tabs-accent:      var(--markdown-tabs-accent, oklch(0.55 0.15 250));
    --_tabs-bg:          var(--markdown-tabs-bg, transparent);
    --_tabs-border:      var(--markdown-tabs-border, oklch(0.88 0.01 250));
    --_tabs-label-color: var(--markdown-tabs-label-color, inherit);
    --_tabs-radius:      var(--markdown-tabs-radius, 0.375rem);

    display: grid;
    /* row 1: tab strip (summaries); row 2: open panel */
    grid-template-rows: auto 1fr;
    /* subgrid column per details child, so all summaries align */
    grid-template-columns: repeat(auto-fill, minmax(0, 1fr));
    border: 1px solid var(--_tabs-border);
    border-radius: var(--_tabs-radius);
    background: var(--_tabs-bg);
    overflow: hidden;
  }
```

Each `<details>` participates in the grid. The `<summary>` elements form the tab
strip in row 1; only the open `<details>` expands its `<section>` into row 2.
CSS subgrid keeps all labels in a shared column track regardless of which panel
is open.

### `<details>` and `<summary>` resets

```css
/* Suppress native disclosure triangle */
details.markdown-tabs-item > summary.markdown-tabs-label {
  list-style: none;
  cursor: pointer;

  &::-webkit-details-marker {
    display: none;
  }
}

/* Hide panel content when details is closed */
details.markdown-tabs-item:not([open]) > section.markdown-tabs-panel {
  display: none;
}
```

### Tab strip

```css
summary.markdown-tabs-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-weight: 500;
  color: var(--_tabs-label-color);
  border-block-end: 2px solid transparent;
  transition:
    color 0.2s ease,
    border-color 0.2s ease;

  /* Active tab — driven by [open] on the parent details */
  details[open] > & {
    color: var(--_tabs-accent);
    border-block-end-color: var(--_tabs-accent);
  }
}
```

The active underline is a `border-block-end` that transitions from `transparent` to
the accent color when the parent `<details>` receives the `[open]` attribute. This
is the baseline active indicator that works everywhere.

### Follow-the-leader indicator (CSS Anchor Positioning)

In browsers that support CSS Anchor Positioning (Chromium 125+, Interop 2025), the
active underline can animate smoothly across tabs using the follow-the-leader pattern:
the open `<summary>` declares itself as the named anchor; a pseudo-element positioned
relative to that anchor follows it with a CSS transition.

```css
@supports (anchor-name: --x) {
  summary.markdown-tabs-label {
    /* Each summary is a potential anchor */
    anchor-name: --tabs-active-label;

    /* Suppress the static border — the follower pseudo-element takes over */
    details[open] > & {
      border-block-end-color: transparent;
    }
  }

  /* The follower: a pseudo-element on the container positioned to the
       open summary via anchor(). Transitions smoothly as [open] moves. */
  .markdown-tabs::after {
    content: "";
    position: absolute;
    position-anchor: --tabs-active-label;
    left: anchor(left);
    right: anchor(right);
    bottom: anchor(bottom);
    height: 2px;
    background: var(--_tabs-accent);
    transition:
      left 0.25s ease,
      right 0.25s ease;
  }
}
```

The `anchor-name` property on each `<summary>` means the most recently open tab
"claims" the `--tabs-active-label` anchor name; only the currently open `<details>`
has a `<summary>` that is the active one the browser resolves, so the pseudo-element
snaps to it. The `transition` on `left`/`right` produces the sliding animation.

The `@supports (anchor-name: --x)` guard ensures the enhancement is applied only
where supported; the baseline `border-block-end` transition is the fallback.

> **Note:** CSS Anchor Positioning is Interop 2025. Baseline availability as of
> mid-2025 is Chromium 125+ and Safari 18.2+; Firefox support is in progress.
> The `@supports` guard makes the enhancement fully progressive.

### Panel

```css
section.markdown-tabs-panel {
  grid-column: 1 / -1; /* span all columns in row 2 */
  padding: 1rem;
  border-block-start: 1px solid var(--_tabs-border);

  /* Remove top margin from the first block child */
  > :first-child {
    margin-block-start: 0;
  }
  > :last-child {
    margin-block-end: 0;
  }
}
```

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  summary.markdown-tabs-label {
    transition: none;
  }

  .markdown-tabs::after {
    transition: none;
  }
}
```

### Public custom properties (override API)

| Property                      | Default                | Description                          |
| ----------------------------- | ---------------------- | ------------------------------------ |
| `--markdown-tabs-accent`      | `oklch(0.55 0.15 250)` | Active tab color and indicator color |
| `--markdown-tabs-bg`          | `transparent`          | Container background                 |
| `--markdown-tabs-border`      | `oklch(0.88 0.01 250)` | Border and panel divider color       |
| `--markdown-tabs-label-color` | `inherit`              | Inactive label text color            |
| `--markdown-tabs-radius`      | `0.375rem`             | Container corner radius              |

All properties cascade normally — set them on `.markdown-tabs`, on any ancestor, or
on `:root` for a global theme. The `light-dark()` wrapping on default values means
the defaults adapt to `color-scheme` automatically; consumer overrides can also use
`light-dark()` for the same behavior.

### `@layer` ordering

The stylesheet declares a single layer:

```css
@layer markdown-tabs;
```

Consumers who want to establish explicit layer ordering across the plugin set can
declare all layers before importing any stylesheets:

```css
@layer markdown-alerts, markdown-tabs, markdown-steps;
```

Unlayered consumer rules always win over layered plugin rules regardless of
declaration order.

---

## Attrs protocol

The tabs block participates in the attrs extensibility protocol used across this
plugin set.

- The outer `<div>` carries `attrsRole: "container"` — a standalone attrs paragraph
  after the block (e.g. `{#my-tabs}`) applies to the `<div>`
- Each `<details>` carries `attrsRole: "containerItem"` and `attrsItemTitle: true` —
  inline attrs on a label line (e.g. `% Tab One {.active}`) apply to that `<details>`

---

## Identifier algorithm

### `data-tabs-group` (content-based, cross-block stable)

1. Collect all label strings from the block (plain text, inline markup stripped)
2. Slugify each: lowercase, collapse whitespace to `-`, strip non-alphanumeric except `-`
3. Sort alphabetically
4. Join with `-`
5. Apply djb2 hash to the joined string
6. Format as a hex string, e.g. `"npm-pnpm-yarn"` → `"a1b2c3"`

Two blocks with labels `["npm", "pnpm", "yarn"]` and `["yarn", "npm", "pnpm"]`
produce identical `data-tabs-group` values.

### `block-id` (order-based, page-unique)

1. Take the group's index among the document's tab groups, counted from 0 in the order they open in the output (a nested group counts after the group around it)
2. Combine with the content-based group hash as `{index}:{group-hash}`
3. Apply djb2 and format as a hex string prefixed with `tabs-`, e.g. `"tabs-d4e5f6"`

This ensures two groups with identical label sets anywhere in the document, including groups nested in step bodies or other tabs' panels, produce different `name` attribute values and do not interfere with each other's exclusive-open behavior. Every engine counts the same groups in the same order, so the ids match across engines; a group's id only changes when a group before it is added or removed.

---

## Degraded rendering

In environments that parse standard CommonMark without the tabs plugin:

- `% Tab One` renders as a bare paragraph containing the literal text `% Tab One`
- `%+ Tab One` renders as a bare paragraph containing `%+ Tab One`
- `>` continuation lines render as standard blockquotes — content is readable and
  visually indented

The result is a sequence of labeled blockquotes, one per tab. Content is fully
accessible and legible without interactivity.

---

## Cross-block sync (optional JS layer)

The base output supports optional consumer-supplied sync without any changes to the
plugin output. The public contract:

1. Listen for `toggle` events on `<details>` inside `.markdown-tabs`
2. When a tab opens, read its `data-tab` value and its parent's `data-tabs-group`
3. Find all other `<details>` on the page where the parent shares the same
   `data-tabs-group` and the element shares the same `data-tab`, and open them

The optional JS layer is also the appropriate place to upgrade to full ARIA tab
semantics by adding `role="tablist"`, `role="tab"`, `role="tabpanel"`, and managing
`aria-selected` state dynamically.

The `data-tabs-group` and `data-tab` attributes are the stable public API.
No sync script is shipped with the plugin.

---

## Scope and non-goals

- No JavaScript is shipped with or required by the plugin
- No `:target`-based sync
- No directive syntax (`:::tabs`)
- No `command`/`commandfor` or Popover API usage (insufficient browser support and
  wrong semantic model for tabs)
- Cross-block sync is explicitly a consumer responsibility
- Full ARIA tabs pattern (`role="tablist"` etc.) is a consumer responsibility via
  the optional JS layer
- The `name` attribute exclusive-open is the only built-in interactivity
