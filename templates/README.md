# Authoring a new plugin set

This folder holds the scaffolds for adding a new syntax extension to Mirrordown.
A "plugin set" is the full unit of work — it is **not** a single package:

| Piece                          | Lives in                              | From template      |
| ------------------------------ | ------------------------------------- | ------------------ |
| markdown-it plugin             | `packages/mdit-<name>/`               | `templates/mdit`   |
| remark/rehype plugin           | `packages/remd-<name>/`               | `templates/remd`   |
| Sätteri plugin ¹               | `packages/sat-<name>/`                | `templates/sat`    |
| VSCode preview extension       | `extensions/markdown-<name>/`         | `templates/extension` |
| Documentation guide            | `docs/public/guide/plugins/<name>.md` | (write by hand)    |
| Tests                          | `tests/<name>/`                       | (write by hand)    |
| Preset entries                 | `packages/preset-*/`                  | (add by hand)      |

¹ If Sätteri already parses the syntax (as with `sub` and `sup`), there is no package: document the Sätteri feature flag in the guide and run the shared fixtures through it in `tests/<name>/sat.test.ts`.

> Building this as an agent? Use the **`author-plugin-set`** skill — it walks the
> same process below, starting with a scoping conversation.

## The one rule that matters most

**The `mdit-`, `remd-` and `sat-` plugins must emit byte-identical HTML** for the same input. The three engines parse very differently (a flat token stream, a micromark-built mdast/hast tree, a Rust parser with JS visitors), but consumers should not be able to tell which one rendered a page. Every test fixture is run through *all three* and compared; keep them in lockstep as you build, not at the end. The only accepted differences are hard limits of an engine itself (such as `<s>` vs `<del>` for GFM strikethrough), kept out of shared fixtures.

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

   The Sätteri plugin is an mdast or hast visitor plugin, written as a factory (`satteri<Name>(options) => (ctx) => plugin`). Sätteri has no mdast→hast handler hook, so new nodes render through `data.hName` / `data.hProperties`. Logic the engines must compute identically (a delimiter scan, marker rules, slugging) belongs in `@mirrordown/core`, not in three copies. See SPEC §4.5 for the Sätteri specifics: minimal plugin types (so `markdownToHtml` stays synchronous), escapes, and positions.

4. **Implement to parity**, writing the shared test fixtures as you go.

5. **Style, if needed.** Put visual defaults inside `@layer markdown-<name>` so
   consumers override them without `!important`. Put *functional* rules that must
   beat a host's unlayered CSS (scroll locks, sizing the preview depends on)
   **outside** any layer. Mirror the CSS file in every package that ships it (`mdit`, `remd`, `sat`).

6. **Document, then generate.** Write the guide at
   `docs/public/guide/plugins/<name>.md` (it doubles as the live demo and the
   README source), wire the plugin into `docs/astro.config.ts` and import its CSS
   in `docs/src/layouts/Markdown.astro`. Then add `<name>` to the slug lists in
   `scripts/generate-readmes.mjs` and `scripts/generate-extension-readmes.mjs`
   and run them — **package and extension READMEs are generated from the guide**,
   not written by hand. (`inline-svg` is the lone hand-authored exception.)

   The guide's Usage section has a tab per engine (`% Remark`, `% Markdown-It`, `% Sätteri`); each package's README is built from its own engine's tab. Commit the generated READMEs as they come out: they are excluded from `vp fmt`, which would rewrite the markdown inside their samples.

7. **Build the extension** from `templates/extension`, then add
   `saeris.markdown-<name>` to the `extensionPack` in
   `extensions/markdown-preview-extended-syntax`.

8. **Add it to the presets.** Register the feature in `preset-markdown-it`, `preset-remark` and `preset-satteri` under the same camelCase option key, in plugin order, and `@import` its stylesheet in each preset's `styles.css`. Add a sample to the feature table in `tests/presets/presets.test.ts`; the full-suite test there then checks the feature's fixtures against every other plugin, in every engine.

## Conventions worth knowing

- **Exports & publishing.** `mdit` exposes its stylesheet at `./styles`; `remd`
  and `sat` expose it at `./*.css`. New package names need claiming on npm and JSR before their first publish (SPEC §9.3). Type-only npm deps (`hast`, `mdast`) go in the
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

- [ ] `vp check` is clean (format, lint, types), after `vp run --filter "./packages/**" build`: the type check reads each package's built types, and an unbuilt package's types silently become `any`.
- [ ] `vp test` passes; the `mdit`, `remd` and `sat` outputs are identical across the shared fixtures.
- [ ] The feature is in all three presets, and the full-suite test in `tests/presets` passes.
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
