# Authoring a new plugin set

This folder holds the scaffolds for adding a new syntax extension to Mirrordown.
A "plugin set" is the full unit of work — it is **not** a single package:

| Piece                          | Lives in                              | From template      |
| ------------------------------ | ------------------------------------- | ------------------ |
| markdown-it plugin             | `packages/mdit-<name>/`               | `templates/mdit`   |
| remark/rehype plugin           | `packages/remd-<name>/`               | `templates/remd`   |
| VSCode preview extension       | `extensions/markdown-<name>/`         | `templates/extension` |
| Documentation guide            | `docs/public/guide/plugins/<name>.md` | (write by hand)    |
| Tests                          | `tests/<name>/`                       | (write by hand)    |

> Building this as an agent? Use the **`author-plugin-set`** skill — it walks the
> same process below, starting with a scoping conversation.

## The one rule that matters most

**The `mdit-` and `remd-` plugins must emit byte-identical HTML** for the same
input. The two ecosystems parse very differently (a flat token stream vs. an
mdast/hast tree), but consumers should not be able to tell which one rendered a
page. Every test fixture is run through *both* and compared; keep them in lockstep
as you build, not at the end.

## Getting started

1. **Scope it first.** Decide the syntax (the sigil/delimiter), what HTML it
   produces, and how it degrades when the plugin isn't present. Check that the
   sigil doesn't collide with other plugins (`~~` del, `==` mark, `++` ins, `~`
   sub, `^` sup, `[[ ]]` kbd, `{ }` attrs, `% / @N.` containers) or with
   CommonMark/GFM. Research prior art and, for anything interactive, the web
   platform features you'll rely on. Write the failure modes down before coding.

2. **Copy the templates** into place and replace the `<name>` placeholders and
   the generic `plugin` export with a descriptive name (e.g. `lightbox`,
   `githubAlerts` / `rehypeLightbox`). Run `vp install`.

3. **Pick the remark shape.** If your syntax maps onto existing HTML elements,
   write a **rehype** plugin that transforms the hast tree (like `lightbox`,
   `unwrap-images`). If you introduce a *new* node type that needs custom
   mdast→hast conversion, write a **remark** plugin plus exported
   `<name>HastHandlers` (like `github-alerts`, `tabs`, `steps`). markdown-it is
   always a single core/inline rule + renderer.

4. **Implement to parity**, writing the shared test fixtures as you go.

5. **Style, if needed.** Put visual defaults inside `@layer markdown-<name>` so
   consumers override them without `!important`. Put *functional* rules that must
   beat a host's unlayered CSS (scroll locks, sizing the preview depends on)
   **outside** any layer. Mirror the CSS file in both packages.

6. **Document, then generate.** Write the guide at
   `docs/public/guide/plugins/<name>.md` (it doubles as the live demo and the
   README source), wire the plugin into `docs/astro.config.ts` and import its CSS
   in `docs/src/layouts/Markdown.astro`. Then add `<name>` to the slug lists in
   `scripts/generate-readmes.mjs` and `scripts/generate-extension-readmes.mjs`
   and run them — **package and extension READMEs are generated from the guide**,
   not written by hand. (`inline-svg` is the lone hand-authored exception.)

7. **Build the extension** from `templates/extension`, then add
   `saeris.markdown-<name>` to the `extensionPack` in
   `extensions/markdown-preview-extended-syntax`.

## Conventions worth knowing

- **Exports & publishing.** `mdit` exposes its stylesheet at `./styles`; `remd`
  exposes it at `./*.css`. Type-only npm deps (`hast`, `mdast`) go in the
  `remd` package's `jsr.json` `imports` map so the JSR build resolves them.
- **Tests.** Fixtures are `<name>-commonmark.md` / `<name>-gfm.md` paired with
  `expected/*.html`, split on `<!-- @case: NAME -->` markers. Encode invariants
  *as fixture cases* (count, ordering, id stability) so both engines assert them
  identically — don't duplicate hand-written assertions. Add a `<name>` + each
  interacting plugin compatibility suite (always `attrs`; plus any plugin that
  touches the same content).
- **TypeScript.** New packages opt into `noUncheckedIndexedAccess` and
  `exactOptionalPropertyTypes` in their own `tsconfig.json` (we're rolling these
  out package-by-package). Prefer iteration that avoids raw index access.

## Quality checklist

Before opening a PR, all of these must hold:

- [ ] `vp check` is clean (format, lint, types).
- [ ] `vp test` passes; the `mdit` and `remd` outputs are identical across the
      shared fixtures.
- [ ] Fixtures cover edge cases, GFM vs CommonMark, combinations (lists,
      blockquotes, tables, links), and compatibility with interacting plugins.
- [ ] Invariants are encoded as fixture cases, not duplicated assertions.
- [ ] `vp dlx jsr publish --dry-run --allow-dirty` reports no slow types in each
      package.
- [ ] The package `tsconfig.json` files enable the strict flags above and
      `tsc -p <pkg> --noEmit` is clean.
- [ ] A guide page exists; READMEs are regenerated from it.
- [ ] If the syntax ships CSS, the extension re-asserts any host-integration
      rules unlayered, and the extension builds and packages (`vp run build`).
- [ ] The extension is added to the extension pack.
