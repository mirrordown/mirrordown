---
name: author-plugin-set
description: Use when adding a new markdown syntax extension to this repo (Mirrordown) — building the paired markdown-it (`mdit-*`) and remark/rehype (`remd-*`) plugins, their tests, the VSCode preview extension, and the docs guide. Starts by scoping the syntax and behavior with the user before any code is written. Invoke for requests like "add a new plugin for X syntax", "build a <name> markdown extension", or "author a new plugin set".
---

# Authoring a new plugin set

A "plugin set" is one syntax extension delivered across the whole suite, not a
single package:

- `packages/mdit-<name>/` — markdown-it plugin
- `packages/remd-<name>/` — remark/rehype plugin
- `tests/<name>/` — shared fixtures run through **both** plugins
- `docs/public/guide/plugins/<name>.md` — the guide (also the README source)
- `extensions/markdown-<name>/` — VSCode preview extension

Scaffolds live in `templates/{mdit,remd,extension}`. General repo/tooling facts
(the `vp` CLI, Vite+ rules, monorepo layout) are in `CLAUDE.md` — don't re-derive
them; this skill only covers what's specific to authoring a plugin set.

**The invariant that governs everything: `mdit-<name>` and `remd-<name>` must
emit byte-identical HTML for the same input.** Verify parity continuously, not at
the end.

## Phase 0 — Scope it with the user (do this first)

Do not start coding. Hold a short design conversation and converge on these before
building. Use `AskUserQuestion` for genuine forks; recommend a default otherwise.

1. **Syntax.** What does the author type? Pick a sigil/delimiter and confirm it
   doesn't collide with existing plugins (`~~`, `==`, `++`, `~`, `^`, `[[ ]]`,
   `{ }`, `% `, `@N.`), with image/link syntax, or with CommonMark/GFM. Prefer a
   sigil that leaves room to evolve (e.g. don't consume URL-fragment space if a
   future feature might want it).
2. **Output.** What HTML does it produce? What classes/attributes/elements?
3. **Degradation.** What shows when the plugin isn't installed? (Usually the raw
   sigil stays as literal text and the base element still renders.)
4. **Prior art & platform.** Research comparable plugins and, for anything
   interactive, the web-platform features you'll lean on and their support. Bring
   findings back; let them inform the syntax so you don't paint into a corner.
5. **Edge contexts — get judgment calls.** Decide explicitly what happens in the
   awkward combinations: inside a link, inside lists/blockquotes/tables, repeated
   uses, nesting, GFM vs CommonMark. These are exactly the cases that later become
   fixture cases. Surface conflicts rather than averaging them.
6. **Constraints.** Accessibility, no-JS (the VSCode preview runs no scripts),
   etc. State them as hard requirements.

Confirm the scope (an `ExitPlanMode` plan is a good fit) before writing code.

## Phase 1 — Scaffold

Copy `templates/mdit`, `templates/remd`, (and later `templates/extension`) into
place. Replace every `<name>` and rename the generic `plugin` export to something
descriptive (`lightbox`; `rehypeLightbox`). Match the conventions an existing
recent package uses for `package.json` / `jsr.json` exports, peer deps, and the
`bumpy` block — read one as a reference rather than inventing. Run `vp install`.

**Choose the remark shape:**

- Maps onto existing HTML elements → a **rehype** plugin operating on the hast
  tree (`Plugin<[], Root>` from `hast`). Simplest; no `remarkRehype` wiring.
- Introduces a new node type needing custom mdast→hast conversion → a **remark**
  plugin **plus** an exported `<name>HastHandlers` object that consumers pass to
  `remarkRehype({ handlers })`. (See `github-alerts`, `tabs`, `steps`.)

markdown-it is always a core or inline rule plus a renderer rule.

## Phase 2 — Implement to parity

Build both, comparing output as you go (render the same snippets through each and
diff). Cross-engine traps that have actually bitten this codebase:

- **Marker residue differs.** Stripping a leading sigil from a text token leaves
  an _empty text token_ in markdown-it but an empty (whitespace-equivalent) text
  node in hast. Downstream plugins (e.g. `unwrap-images`) treat these differently.
  Clean up emptied tokens/nodes so both trees read the same.
- **Renderer vs. tree wrapping.** markdown-it decorates at _render_ time; rehype
  decorates the _tree_. This affects ordering against other plugins and what your
  wrapper actually contains. Keep it in mind when a combination behaves oddly.
- **Stable ids.** If you emit ids, derive them from content (e.g. a hash of a
  src/value), not a counter — stable across edits and identical across engines,
  and it lets repeated references dedupe to one target.
- **`<dialog>` / flow content can't live inside a `<p>`.** Emit such elements at
  the document end and link them by id; keep only the inline trigger in place.

**CSS (if any):** visual defaults go inside `@layer markdown-<name>` so consumers
override without `!important`. Functional rules that must beat a host's _unlayered_
CSS (scroll locks, sizing) go **outside** any layer — a layer always loses to
unlayered host CSS regardless of specificity. Keep the stylesheet identical in
both packages.

## Phase 3 — Tests (this is where parity is enforced)

Model on an existing `tests/<plugin>/` suite. Structure:

- `fixtures/<name>-commonmark.md` and `fixtures/<name>-gfm.md`, paired with
  `expected/*.html`, split on `<!-- @case: NAME -->` markers. Generate `expected`
  from one engine, eyeball it, then assert the _other_ engine matches it too.
- `mdit.test.ts` and `remd.test.ts` each run the **same** fixtures via
  `parseFixture`/`normalizeHtml` from `tests/utils`. The remd test runs the
  commonmark fixture through a plain pipeline and the gfm fixture through one with
  `remark-gfm`.
- **Encode invariants as fixture cases**, not duplicated `it()` assertions —
  count == count, ordering, id stability, dedup, "no opt-in → no change", "inside
  a link → unchanged". The expected HTML _is_ the assertion, and both engines run
  it. Reserve standalone `it()`s for genuine per-engine quirks only.
- Evaluate **GFM vs CommonMark**: confirm the syntax behaves identically; only
  split a gfm fixture for cases that need GFM features (tables, etc.). An engine
  difference that isn't yours (e.g. `<s>` vs `<del>`) shouldn't be forced into a
  shared fixture.
- **Compatibility suites.** Add `tests/<name>/attrs.test.ts` (always — `{#id}`,
  `{.class}` interaction). Also add a suite for every _other_ plugin that touches
  the same content (for image plugins: `unwrap-images`, `inline-svg`). Some
  conflicts are architectural and unfixable by ordering — surface them and decide
  with the user rather than forcing a green test.

Run the full suite; `mdit` and `remd` must be identical on every shared case.

## Phase 4 — Cleanup passes

- **JSR slow types.** In each package: `vp dlx jsr publish --dry-run --allow-dirty`
  must report no slow types. Exports need explicit types (they already do if you
  typed `lightbox: PluginSimple` / `rehypeLightbox: Plugin<[], Root>`).
- **Strict TypeScript.** Add `noUncheckedIndexedAccess` and
  `exactOptionalPropertyTypes` to the package `tsconfig.json` (rolled out
  per-package). Fix by _restructuring_, not asserting: iterate with `for…of` and a
  carried `prev` instead of `arr[i]`/`arr[i-1]`; guard optional access. Verify
  with `tsc -p packages/<pkg>/tsconfig.json --noEmit`.
- **Simplify** what the strict pass exposes; leave intentional duplication (a tiny
  shared helper copied between two independent packages) alone.

## Phase 5 — Docs guide (the source of truth)

Write `docs/public/guide/plugins/<name>.md`, modeling structure on an existing
guide. It uses the `remd-tabs` syntax: `% Demo` / `% Code` pairs for syntax
examples (live render + raw source), and a `## Usage` section with `% Remark` /
`% Markdown-It` tabs and `%%` sub-tabs (Unified / Astro / VitePress / Standalone).
Then:

- Add the plugin to `docs/astro.config.ts` (`rehypePlugins`/`remarkPlugins`, plus
  `remarkRehype.handlers` if you have hast handlers). Order matters against other
  image/content plugins.
- Import its CSS in `docs/src/layouts/Markdown.astro`, and add the workspace dep
  to `docs/package.json`.
- Live demos need assets: put images under
  `docs/public/guide/plugins/assets/` and reference them relatively.
- Build the docs to verify (`astro build` via `vp exec`).

**READMEs are generated, not written.** Add `<name>` to the slug lists in
`scripts/generate-readmes.mjs` (package READMEs) and the `EXTENSIONS` map in
`scripts/generate-extension-readmes.mjs` (extension README), then run them. The
guide is the single source. (`inline-svg` is the only hand-authored exception.)

## Phase 6 — VSCode extension

From `templates/extension`: contribute `markdown.markdownItPlugins: true` and, if
there's CSS, `markdown.previewStyles`. The extension's `src/<name>.css` should
`@import` the plugin stylesheet and then **re-assert, unlayered, any rule the
preview must honor** — VSCode ships unlayered base CSS (e.g.
`img { max-width: 100% }`) that beats the plugin's `@layer` defaults. Keep that
override in the extension (host-integration concern), not the plugin. Force-bundle
the plugin (`pack.deps.alwaysBundle`) so the vsix isn't shipping a bare `require`.
Build with `vp run build` and confirm the vsix bundles the plugin and inlines the
CSS. Add `saeris.markdown-<name>` to the `extensionPack`.

## Quality gates (all must pass)

- `vp check` clean; `vp test` green; `mdit` ≡ `remd` on every shared fixture.
- Fixtures cover edge cases, GFM vs CommonMark, combinations, and plugin compat;
  invariants are fixture cases.
- JSR dry-run: no slow types. Strict-flag `tsc` clean per package.
- Guide page exists; READMEs regenerated from it.
- Extension builds/packages and is in the pack.

Work the phases in order, checkpoint after each, and keep the two plugins in
lockstep throughout.
