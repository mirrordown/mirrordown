# Typography System

This document specifies the typography and color token system used across the `@saeris/markdown` docs site. All tokens are defined in `docs/src/styles/theme.css` and consumed site-wide.

---

## Typefaces

### Body — Mona Sans Variable

GitHub's Mona Sans is used for all UI and prose text. It is a variable font with three axes:

| Axis   | Range   | CSS property   |
| ------ | ------- | -------------- |
| `wght` | 200–900 | `font-weight`  |
| `wdth` | 75–125  | `font-stretch` |
| `ital` | 0–1     | `font-style`   |

Loaded via `@fontsource-variable/mona-sans/wght.css` — the weight-only subset, avoiding the larger multi-axis file.

```css
--family-sans: "Mona Sans Variable", system-ui, -apple-system, sans-serif;
```

### Code — Monaspace Family

The Monaspace family (GitHub Next) is used for all monospaced text. Each variant carries a semantic role in syntax-highlighted code, following the Lettermatic case study on the typeface's design:

| Variable                | Family            | Semantic role              |
| ----------------------- | ----------------- | -------------------------- |
| `--family-mono`         | Monaspace Neon    | Default / identifiers      |
| `--family-mono-comment` | Monaspace Argon   | Comments and documentation |
| `--family-mono-string`  | Monaspace Krypton | String literals            |
| `--family-mono-keyword` | Monaspace Xenon   | Keywords and operators     |
| `--family-mono-heading` | Monaspace Radon   | Code headings / titles     |

Currently only Neon (400, 600) is applied in rendered code. The other variants are loaded and reserved for future Shiki/rehype syntax-font integration.

---

## Font Size Scaling by Reference Ratio

Before using any font at a given size, its x-height relative to a reference font should be measured. The APCA readability guidelines are calibrated against a reference font; non-standard fonts need a ratio adjustment so they meet the same visual standards.

**Process:**

1. Render a lowercase `x` in the reference font and in your design font at the same size (e.g. 100px).
2. Measure the x-height of each in pixels using a screenshot.
3. Divide: `ratio = reference x-height / design font x-height`.
4. Multiply APCA-recommended sizes by this ratio to get the appropriate size for your font.

For example: if APCA specifies 18px and the ratio is 1.05, use `18px × 1.05 = 18.9px ≈ 19px`.

Mona Sans's x-height is close to the reference font, so `--font-base: 18px` is used without adjustment.

---

## Type Scale

The scale uses a **Major Second** ratio (`1.125`), anchored at `--fs-100 = 18px`. Every step is exactly one ratio from its neighbor — no manual approximations. Steps below 100 divide; steps above 100 multiply.

```
--fs-50   = fs-75  / 1.125  ≈ 14.2px
--fs-75   = fs-100 / 1.125  ≈ 16px
--fs-100  = 18px             ← anchor (body Medium)
--fs-200  = fs-100 × 1.125  ≈ 20.25px
--fs-300  = fs-200 × 1.125  ≈ 22.8px
--fs-400  = fs-300 × 1.125  ≈ 25.6px
--fs-500  = fs-400 × 1.125  ≈ 28.8px
--fs-600  = fs-500 × 1.125  ≈ 32.4px
--fs-700  = fs-600 × 1.125  ≈ 36.5px
--fs-800  = fs-700 × 1.125  ≈ 41px
--fs-900  = fs-800 × 1.125  ≈ 46px
```

The floor (`--fs-50` ≈ 14.2px) satisfies the APCA minimum of 12px for non-essential text. To rekey the entire scale, change only `--font-base`.

---

## Semantic Size Aliases

Raw scale stops are mapped to semantic t-shirt names. The same T→S→M→L→H→U progression applies across all categories, with **Medium always equaling the anchor (18px)** for body and labels.

### Headings (H6→Tiny … H1→Ultra)

Headers use `clamp()` so they scale fluidly between the minimum at narrow viewports and the maximum on wide screens.

```css
--ht: var(--fs-200); /* h6 — Tiny    ≈20px  */
--hs: var(--fs-300); /* h5 — Small   ≈22.8px */
--hm: var(--fs-400); /* h4 — Medium  ≈25.6px */
--hl: clamp(var(--fs-400), 3vw, var(--fs-500)); /* h3 — Large   ≈28.8px */
--hh: clamp(var(--fs-500), 4vw, var(--fs-600)); /* h2 — Huge    ≈32px  */
--hu: clamp(var(--fs-600), 5vw, var(--fs-700)); /* h1 — Ultra   ≈36px  */
```

### Body (Tiny … Large)

Medium (`--bm`) maps to `--font-base` — the main reading size for prose.

```css
--bt: var(--fs-50); /* Tiny   ≈14.2px — timestamps, hints    */
--bs: var(--fs-75); /* Small  ≈16px   — captions, metadata   */
--bm: var(--fs-100); /* Medium  18px   — main prose ← default */
--bl: var(--fs-200); /* Large  ≈20px   — lead paragraphs      */
```

### Labels (Tiny … Medium)

Labels use the lower end of the body scale. Medium label (`--lm`) equals body Medium — consistent size for nav and sidebar text.

```css
--lt: var(--fs-50); /* Tiny   ≈14.2px — kbd hints, timestamps */
--ls: var(--fs-75); /* Small  ≈16px   — section group titles  */
--lm: var(--fs-100); /* Medium  18px   — nav links, sidebar    */
```

---

## Margins

Margins are derived from the font size and the scale ratio, following the Adobe Spectrum principle that breathing room should be proportional to the element's own size.

```css
--margin-top-ratio: var(--scale); /* 1.125 on desktop */

--header-margin: calc(var(--fs-heading) / var(--margin-top-ratio))
  calc(var(--fs-heading) * 0.25);
--body-margin: calc(var(--fs-body) / var(--margin-top-ratio))
  calc(var(--fs-body) * 0.25);
--label-margin: calc(var(--fs-label) / var(--margin-top-ratio))
  calc(var(--fs-label) * 0.25);
```

- **Top** = `size / ratio` — proportional gap above the element, slightly smaller than the element itself
- **Bottom** = `size × 0.25` — compact spacing below, keeping content grouped with what follows

On narrow screens (`width <= 640px`) the ratio shifts to `1.618` (Golden Ratio), which produces more generous top margins relative to the element size — appropriate for single-column reading on mobile.

Usage: `margin: var(--body-margin)` sets both top and bottom at once.

---

## Font Weight — Irradiation Compensation

Text on dark backgrounds appears heavier due to the **irradiation illusion** — bright glyphs bloom against a dark surround. To maintain consistent perceived stroke width across themes, dark mode uses lighter numeric weights:

```css
--fw-regular: light-dark(400, 350);
--fw-medium: light-dark(500, 450);
--fw-semibold: light-dark(600, 550);
--fw-bold: light-dark(700, 650);
```

Always use `var(--fw-*)` tokens rather than bare numbers. The compensation applies automatically via `light-dark()` when the color scheme changes — without layout shift, since variable fonts interpolate weights continuously.

---

## Font Shorthands

The CSS `font` shorthand combines weight, size, line-height, and family into a single property:

```css
--font-body: var(--fw-regular) var(--bm) / 1.75 var(--family-sans);
--font-body-sm: var(--fw-regular) var(--bs) / 1.6 var(--family-sans);
--font-label: var(--fw-regular) var(--lm) / 1.4 var(--family-sans);
--font-label-sm: var(--fw-medium) var(--ls) / 1.4 var(--family-sans);
--font-code: var(--fw-regular) var(--bm) / 1.6 var(--family-mono);
```

Usage:

```css
p {
  font: var(--font-body);
}
code {
  font: var(--font-code);
}
```

Note: the `font` shorthand resets all sub-properties. If you need to override one (e.g. `font-style: italic`), declare it after the shorthand.

---

## Color System

### Structure

All colors use `light-dark(light-value, dark-value)` pairs. Switching themes requires only `color-scheme: light` or `color-scheme: dark` on an ancestor — no class toggling or JavaScript needed at the token level.

```css
[data-theme="light"] {
  color-scheme: light;
}
[data-theme="dark"] {
  color-scheme: dark;
}
/* default: color-scheme: light dark — follows OS preference */
```

### Color Tokens

```
--color-bg            Page background
--color-bg-elevated   Surface above page (header, cards)
--color-sidebar-bg    Sidebar background
--color-code-bg       Inline code and code block backgrounds

--color-fg            Primary text
--color-fg-muted      Secondary text (labels, captions)
--color-fg-subtle     Tertiary text (hints, disabled)

--color-accent        Interactive accent (links, active states)
--color-accent-hover  Accent on hover
--color-accent-subtle Low-chroma tint for active backgrounds

--color-border        Primary borders and dividers
--color-border-muted  Secondary borders
```

### Relative Color Syntax

The accent ramp derives all variants from a single `--color-accent-base` using CSS relative color syntax. This means re-theming requires changing only one variable:

```css
--color-accent-base: oklch(0.52 0.18 250);

--color-accent: light-dark(
  var(--color-accent-base),
  oklch(from var(--color-accent-base) calc(l + 0.16) c h)
);
--color-accent-hover: light-dark(
  oklch(from var(--color-accent-base) calc(l - 0.08) calc(c + 0.02) h),
  oklch(from var(--color-accent-base) calc(l + 0.22) calc(c - 0.02) h)
);
```

The `from <color>` syntax extracts `l`, `c`, `h` components and allows arithmetic on them. Dark mode lightens the accent for legibility on dark backgrounds.

### APCA Contrast

Colors target APCA (Accessible Perceptual Contrast Algorithm) lightness values rather than WCAG 1.4.3 ratios. APCA accounts for polarity, font weight, and font size — it is more perceptually accurate.

| Pairing                      | Target Lc |
| ---------------------------- | --------- |
| Body text on background      | Lc 75+    |
| Muted text on background     | Lc 45+    |
| Large headings on background | Lc 60+    |
| Non-text UI elements         | Lc 30+    |

To check a pairing, use the [APCA Contrast Calculator](https://www.myndex.com/APCA/).

---

## Adding a New Token

1. Add the raw scale stop or color pair to `theme.css` under `:root`
2. If it is a semantic alias, add it to the appropriate t-shirt section (heading, body, or label)
3. If it is a font shorthand, compose it from `--fw-*`, `--b*`/`--l*`/`--h*`, and `--family-*` tokens
4. Use the token in component CSS — do not use bare pixel values or hex colors in component files
5. Update this document

---

## File Map

| File                         | Role                                     |
| ---------------------------- | ---------------------------------------- |
| `docs/src/styles/theme.css`  | All design tokens; font imports          |
| `docs/src/styles/global.css` | Base layout and `html`/`body` typography |
| `docs/src/styles/reset.css`  | Box model and browser normalization      |
| `docs/public/markdown.css`   | Prose styles for `.markdown-content`     |
