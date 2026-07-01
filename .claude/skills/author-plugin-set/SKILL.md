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

Scaffolds live in `templates/{mdit,remd,extension}` **at the repo root** (not in
this skill directory). General repo/tooling facts (the `vp` CLI, Vite+ rules,
monorepo layout) are in `CLAUDE.md` — don't re-derive them; this skill only
covers what's specific to authoring a plugin set.

**The invariant that governs everything: `mdit-<name>` and `remd-<name>` must
emit byte-identical HTML for the same input.** Verify parity continuously, not at
the end.

## Phase 0 — Scope it with the user (do this first)

Do not start coding. Hold a short design conversation and converge on these before
building. Use `AskUserQuestion` for genuine forks; recommend a default otherwise.

**Not every plugin introduces syntax.** Some are _transforms_ that act on existing
elements (e.g. `slug`/`autolink-headings` add ids/links to headings; `unwrap-images`
restructures images). For these, items 1 and 3 below largely collapse — there's no
sigil and nothing to "degrade to" — and the design surface shifts to **algorithm
parity** (both engines must compute the _same_ output, e.g. identical id slugs) and
**option scope** (how much of a ported plugin's option surface to support). When
porting an existing plugin (rehype/remark/markdown-it), read its source first and
decide faithfulness vs. simplification explicitly with the user.

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

**Dependencies — inline tiny one-offs, share the parity-critical ones.** Prefer
inlining small, single-purpose utilities (e.g. `hast-util-heading-rank`,
`hast-util-to-string`, a trimmed `convertElement`) as local helpers rather than
adding a dependency the suite doesn't already share — keeps the dependency graph
small. _But_ keep a real dependency when it is the **parity contract itself**: e.g.
both `slug` packages depend on `github-slugger` (a ~2KB Unicode regex + GitHub's
dedup rules) via a shared catalog entry, because hand-vendoring it into two
independently-published packages invites the one-character drift that silently
breaks byte-parity. Add shared deps to the `.yarnrc.yml` `catalog:` block.

**CSS export paths differ by engine** (a real gotcha): `mdit-*` exposes its
stylesheet at `./styles`, `remd-*` at `./*.css`. Type-only deps (`hast`, `mdast`)
go in the `remd` package's `jsr.json` `imports` map; runtime npm deps go in
`package.json` as `"catalog:"` and JSR resolves them via byonm (no `jsr.json`
entry). Some `remd-*` packages also use a separate `./src/jsr.ts` JSR entry to
keep type augmentation out of the public API (avoids slow types) — don't "fix"
that back to `index.ts`.

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
- **Text extraction differs.** markdown-it's `renderInlineAsText` includes an
  image's `alt`; hast's `toString` (what `rehype-slug` uses) does _not_. If you
  derive anything from heading/inline text (a slug, a label), replicate the hast
  semantics in markdown-it — walk the inline token children collecting `text`/
  `code_inline` and **skip `image`** — or the two engines diverge.
- **Entity encoding differs and isn't yours to fix.** markdown-it emits `&amp;`
  where rehype-stringify emits `&#x26;` for a literal `&`. Like `<s>` vs `<del>`,
  keep such constructs out of _shared_ fixtures (your plugin's own output — the
  id, the wrapper — still matches; only the surrounding text encoding differs).

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

**Parity boundary for engine-specific options.** A ported plugin may have options
that are inherently shaped for one engine — e.g. rehype options taking **hast
nodes or callbacks** (`content`, `properties`, `group`, `test`) have no markdown-it
equivalent. Support them on the `remd-*` side, give the `mdit-*` side an analogous
but simpler surface (e.g. a `class` string), and **don't force them into shared
fixtures**: shared fixtures cover only what both engines express identically (the
defaults, static behaviors); engine-only options get a per-engine `it()`. State
this boundary in the guide.

**Lint conventions these tests must follow** (from `vp check`):

- Put `expect(...)` **directly in each `it()` body**, not inside a shared helper —
  the `expect-expect` rule can't see assertions hidden in a helper. Use `it.each`
  with the expects inline to stay DRY.
- No second message argument to `expect()` (Vitest allows it; the lint rule
  forbids it).
- markdown-it renderer rules assigned to `md.renderer.rules.X` need an explicit
  `: string` return type; derive the rule type locally with
  `type RenderRule = NonNullable<typeof md.renderer.rules.heading_open>` rather
  than importing it.

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

The generators rewrite **every** README, and their raw output (e.g. 4-backtick
fences, trailing commas) isn't formatter-clean — the committed form is
post-`vp fmt`. So the workflow is **generate → `vp fmt` → commit**; after
formatting, unrelated READMEs revert to no-diff and only yours change. If one
_doesn't_ revert, the drift is pre-existing: the source `package.json`
`displayName`/`description` changed but its README was never regenerated. The
README is **generated from** the manifest — regenerate it to match the manifest;
do **not** edit the manifest to match the stale README. Before "correcting" any
published metadata that merely looks inconsistent with its siblings, run
`git log -- <file>` to learn _why_ it is that way. Real example this bit: an
extension's `displayName` was intentionally set _without_ its `<tag>` (unlike its
siblings) to dodge a **VS Code Marketplace duplicate-name rejection**; "fixing"
it for consistency re-broke publishing. Read before you write — the reason is
usually one commit away.

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

**Extension granularity — research the host, don't assume one-plugin-one-extension.**
The npm packages stay separate (composable primitives), but the _extension_ story
can differ. When one plugin is useless without another (e.g. `autolink-headings`
needs ids from `slug`), consider shipping a **single combined extension** that
applies both rather than two. Before deciding, check what the VSCode preview
already does: it slugs headings itself with the **same GitHub algorithm** (so ids
won't conflict) and drives **scroll-sync off `data-line` attributes, not ids** (so
adding ids/anchors is safe). A combined extension that bundles both plugins is
self-contained and idempotent against the host's own ids. The extension's package
`name` (not its folder) is the marketplace id used in `extensionPack`.

## Phase 7 — Publishing

New packages start at `version: 0.0.0` and need a **bump file** to get a first
release via CI. Add a changeset-style file under `.bumpy/<slug>.md`:

```md
---
"@mirrordown/remd-<name>": minor
"@mirrordown/mdit-<name>": minor
---

One-line changelog description of the new plugin set.
```

Use `minor` for a first `0.1.0` release (matches the suite), `patch` for the pack
entry (`"markdown-preview-extended-syntax": patch`) and small metadata fixes. One
file per logical change; the description becomes the changelog entry for every
package listed. The `bumpy` "Version packages" CI job consumes these to bump
versions, write `CHANGELOG.md`, and trigger publish — so the working branch just
needs the bump files committed, not the version bumps themselves.

## Quality gates (all must pass)

- `vp check` clean; `vp test` green; `mdit` ≡ `remd` on every shared fixture.
- Fixtures cover edge cases, GFM vs CommonMark, combinations, and plugin compat;
  invariants are fixture cases.
- JSR dry-run: no slow types. Strict-flag `tsc` clean per package.
- Guide page exists; READMEs regenerated from it.
- Extension builds/packages and is in the pack.

Work the phases in order, checkpoint after each, and keep the two plugins in
lockstep throughout.
