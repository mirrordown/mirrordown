# @saeris/markdown — Implementation Specification

> Reference document for the monorepo consolidating all Saeris Markdown plugins.
> Feed this to agents as context for any implementation task.

---

## 1. Repository overview

A Yarn Workspaces monorepo using Vite+ (`vp`) as the unified toolchain. All tooling is
accessed through `vp` — do not invoke vitest, oxlint, oxfmt, tsdown, or yarn directly.

```
@saeris/markdown/          # root (private)
├── docs/                  # Astro documentation site
├── extensions/            # VSCode extensions (one per plugin + one pack)
├── packages/              # npm/JSR plugin packages (remd-* and mdit-*)
└── tests/                 # shared cross-implementation test suite
```

**Root `package.json` workspaces:** `docs/*`, `extensions/*`, `packages/*`, `tests/*`

---

## 2. Plugin inventory

Each feature is represented by up to three artifacts: a `remd-*` package (Remark/Rehype),
an `mdit-*` package (Markdown-It), and a VSCode extension. Not every feature has all three.

| Feature | `@saeris/remd-*` | `@saeris/mdit-*` | Extension | Source |
|---|---|---|---|---|
| del | `remd-del` | `mdit-del` | `markdown-del` ¹ | Own — migrate |
| inline-svg | `remd-inline-svg` | `mdit-inline-svg` | `markdown-inline-svg` | Own — migrate |
| ins | `remd-ins` | `mdit-ins` | `markdown-ins` | Fork |
| mark | `remd-mark` | `mdit-mark` | `markdown-mark` | Fork |
| kbd | `remd-kbd` | `mdit-kbd` | `markdown-kbd` | Fork |
| abbr | `remd-abbr` | `mdit-abbr` | `markdown-abbr` | Fork |
| sub | `remd-sub` | `mdit-sub` | `markdown-subscript` | Fork |
| sup | `remd-sup` | `mdit-sup` | `markdown-superscript` ¹ | Fork |
| definition-list | `remd-definition-list` | `mdit-definition-list` | `markdown-definition-list` | Fork |
| github-alerts | `remd-github-alerts` | `mdit-github-alerts` | `markdown-github-alerts` | Fork |
| attrs | `remd-attrs` | `mdit-attrs` | `markdown-attributes` | Fork |
| ruby | `remd-ruby` | `mdit-ruby` | `markdown-denden-furigana` | Fork |
| unwrap-images | `remd-unwrap-images` | `mdit-unwrap-images` | `markdown-unwrap-images` | Fork |
| header-sections | `remd-header-sections` | `mdit-header-sections` | — | Fork (npm-only) |

**Pack:** `markdown-preview-extended-syntax` — metadata-only, migrated from standalone repo.

¹ Check the VSCode Marketplace for name conflicts before publishing; rename if necessary.

### Fork sources

| Package | Upstream source |
|---|---|
| `remd-ins` | remark-ins |
| `remd-mark` | remark-flexible-markers |
| `remd-kbd` | remark-kbd |
| `remd-abbr` | remark-abbr |
| `remd-sub` / `remd-sup` | remark-supersub (split into two packages) |
| `remd-definition-list` | remark-definition-list |
| `remd-github-alerts` | remark-alerts |
| `remd-attrs` | remark-attributes |
| `remd-ruby` | remark-denden-ruby |
| `remd-unwrap-images` | rehype-unwrap-images |
| `mdit-ins` | markdown-it-ins |
| `mdit-mark` | markdown-it-mark |
| `mdit-kbd` | markdown-it-kbd |
| `mdit-abbr` | @mdit/plugin-abbr |
| `mdit-sub` | @mdit/plugin-sub |
| `mdit-sup` | @mdit/plugin-sup |
| `mdit-definition-list` | @mdit/plugin-dl |
| `mdit-github-alerts` | markdown-it-github-alerts |
| `mdit-attrs` | @mdit/plugin-attrs |
| `mdit-ruby` | markdown-it-ruby |
| `mdit-unwrap-images` | markdown-it-block-image |
| `remd-header-sections` | remark-sectionize |
| `mdit-header-sections` | markdown-it-header-sections |

All forks are full ownership transfers — not upstream-synced. Code is expected to diverge
significantly. Do not use git subtree or submodules.

---

## 3. Naming conventions

- **npm/JSR packages:** `@saeris/remd-<name>` and `@saeris/mdit-<name>`
- **VSCode extensions:** Keep the existing Marketplace identifier (`markdown-<name>`) exactly.
  The `name` field in `package.json` is the extension ID and is immutable once published.
- **`<name>` segment rules:**
  - Use full descriptive words, not acronyms, when it aids searchability
    (`definition-list` not `dl`, `mark` not `highlight`)
  - Use the HTML element name when the feature maps directly to one and the element name
    is well known (`ruby`, not `furigana`; `ins`, `del`, `kbd`, `sub`, `sup`)
  - Use the feature name when the HTML element name is too generic (`mark`, `attrs`,
    `unwrap-images`, `github-alerts`, `inline-svg`)

---

## 4. Package standards

### 4.1 `packages/mdit-*/`

```
mdit-<name>/
├── src/
│   └── index.ts       # named exports only, no default export
├── dist/              # build output (gitignored)
├── package.json
├── tsconfig.json
├── jsr.json
└── vite.config.ts
```

**`package.json` shape:**

```json
{
  "name": "@saeris/mdit-<name>",
  "version": "0.0.0",
  "type": "module",
  "license": "MIT",
  "author": "Drake Costa <drake@saeris.io> (https://saeris.gg)",
  "repository": "git@github.com:saeris/markdown.git",
  "engines": { "node": ">=24.0.0" },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "peerDependencies": {
    "markdown-it": "^14.0.0"
  },
  "devDependencies": {
    "markdown-it": "^14.0.0"
  },
  "bumpy": {
    "buildCommand": "vp pack",
    "publishCommand": [
      "node ../../scripts/sync-jsr-version.mjs",
      "npm publish --access public",
      "npx jsr publish"
    ]
  }
}
```

- No `main`, no `module` field — `exports` is the sole entry point
- `peerDependencies` lists `markdown-it`; consumers must provide it
- `devDependencies` mirrors peerDependencies so the package can be built/tested locally
- `@types/` packages: add to `devDependencies` of the individual package only if needed
  for TypeScript compilation. Do not hoist to root. Modern unified/mdast packages ship
  their own types; audit per plugin during migration.
- `bumpy.buildCommand` runs `vp pack` before publishing; `bumpy.publishCommand` syncs
  `jsr.json`, publishes to npm, then publishes to JSR. Requires `allowCustomCommands: true`
  in `.bumpy/_config.json`.

**`jsr.json`:**

```json
{
  "name": "@saeris/mdit-<name>",
  "version": "0.0.0",
  "exports": {
    ".": "./src/index.ts"
  }
}
```

> **Note:** JSR requires a dedicated `jsr.json` file — there is no `jsr` field in
> `package.json`. The `exports` in `jsr.json` point to TypeScript source, not build output.
> Bumpy does not update `jsr.json` when bumping versions (it only touches `package.json`).
> The `scripts/sync-jsr-version.mjs` script at the repo root handles this: it reads the
> version from `package.json` and writes it to `jsr.json` before `npx jsr publish` runs.
> This script is the first step of every plugin package's `bumpy.publishCommand`.

**`tsconfig.json`:**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"]
}
```

**`vite.config.ts`:**

```ts
import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    entry: 'src/index.ts',
    external: ['markdown-it'],
    dts: true,
  },
});
```

### 4.2 `packages/remd-*/`

Same shape as mdit with these differences:

- `peerDependencies` always includes `unified`; add additional unified ecosystem packages
  (e.g., `mdast-util-*`, `micromark-*`, `hast-util-*`) that appear in the public API
  surface or are required at runtime by the consumer. Audit per plugin during migration.
- `external` in `vite.config.ts` lists all peerDependencies.
- Some plugins are Remark (operate on mdast) and some are Rehype (operate on hast).
  The `remd-` prefix covers both; the README for each package clarifies which it is and
  where it fits in the unified pipeline.

### 4.3 `extensions/*/`

```
<extension-name>/
├── src/
│   └── index.ts
├── dist/
├── package.json       # name field = Marketplace extension ID (do not change)
├── tsconfig.json
└── vite.config.ts
```

**Key differences from plugin packages:**

- `"type"` field is omitted or `"commonjs"` — VSCode extension hosts load CJS or a
  bundled ESM file; `vp pack` produces a self-contained bundle
- The companion `mdit-*` package is listed in `devDependencies` (workspace ref) and
  **bundled** into the extension output — it is not a peerDependency or external
- No `jsr.json`, no npm publish
- No test suite (tests live in `tests/`)
- Source is migrated from JavaScript to TypeScript as part of migration
- Output must be a single bundled file with no external requires so it works in the
  VSCode web extension host (browser environment, no Node.js APIs)

**`vite.config.ts`:**

```ts
import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    entry: 'src/index.ts',
    external: [],        // bundle everything
    dts: false,
    format: 'cjs',       // VSCode extension host requirement
  },
});
```

### 4.4 `tests/` workspace

A single private workspace package at `tests/package.json`:

```json
{
  "name": "@saeris/tests",
  "private": true,
  "type": "module",
  "devDependencies": {
    "@saeris/remd-del": "workspace:*",
    "@saeris/mdit-del": "workspace:*"
    // ... all plugin packages added as features are migrated
  }
}
```

Directory structure:

```
tests/
├── package.json
├── vite.config.ts        # vitest config discovering all *.test.ts
├── utils/
│   └── index.ts          # shared test helpers (populated after first 3 plugin pairs)
└── <name>/
    ├── fixtures/
    │   └── <name>.md     # markdown input (shared between remd and mdit tests)
    ├── expected/
    │   └── <name>.html   # expected HTML output (identical for both implementations)
    ├── remd.test.ts
    └── mdit.test.ts
```

**Test approach:**

- Fixtures are plain `.md` files; expected output is plain `.html` files
- Both `remd.test.ts` and `mdit.test.ts` load the same `.md` fixture and compare against
  the same `.html` expected output
- HTML is normalized before comparison (attribute order, whitespace) using shared helpers
- Shared helpers in `tests/utils/` are extracted after the first three plugin pairs
  provide a sufficient sample for abstraction

**`vite.config.ts` for tests:**

```ts
import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
  },
});
```

---

## 5. TypeScript configuration

The root `tsconfig.json` is the base all packages extend. Current root config applies to
the whole monorepo for editor tooling. Per-package `tsconfig.json` files narrow the scope
for build/emit:

- `jsx`/`jsxImportSource` and `DOM` lib are absent from the root — those go in `docs/tsconfig.json` only
- `moduleResolution: "Bundler"` stays in root (correct for Rolldown/tsdown consumers)
- `noEmit: true` stays in root (for editor/type-check only); per-package configs override
  with `outDir` for actual emit via `vp pack`

---

## 6. Build

All packages use `vp pack` (tsdown via Vite+). Do not install tsdown directly.

- **Output format:** ESM for plugin packages (`.js` with `"type": "module"`), CJS bundle
  for extensions
- **Tree-shaking:** Enabled by default via Rolldown
- **Type declarations:** `dts: true` for plugin packages, `dts: false` for extensions
- Extensions produce a single self-contained file — no externals

---

## 7. Testing

Run with `vp test` from the repo root or from `tests/`.

- Framework: Vitest (via Vite+) — import from `vite-plus/test`
- All tests live in `tests/<name>/`
- Plugin packages themselves contain no test files
- After the first three plugin pairs are migrated, perform a shared-utilities abstraction
  pass on `tests/utils/`

**Integration audit (Phase 5):** After all plugins are present, add tests for combined
usage of multiple plugins in a single document. Priority scenarios:

- `attrs` combined with any other inline plugin (known complexity)
- `ruby` combined with emphasis, strong, and `mark` (known edge-case behavior)
- Other common combination scenarios as discovered

---

## 8. Publishing

Bumpy config lives in two places:

- **`.bumpy/_config.json`** (root): top-level settings; `allowCustomCommands: true` to
  trust per-package commands defined in `package.json`
- **Each package's `package.json`** (under `"bumpy"` key): `buildCommand` and
  `publishCommand` specific to that package

### 8.1 npm + JSR (plugin packages)

Both npm and JSR are published using **OIDC trusted publishing** from GitHub Actions —
no tokens or secrets are required for either registry. Publishing works because the release
job has `id-token: write` permission and each package/scope is linked to this repository
in the respective registry settings (one-time setup per package, see §9.3).

Each plugin package publishes to both npm and JSR. The `"bumpy"` block in each plugin's
`package.json` (see §4.1 template) handles this:

```json
{
  "bumpy": {
    "buildCommand": "vp pack",
    "publishCommand": [
      "node ../../scripts/sync-jsr-version.mjs",
      "npm publish --access public",
      "npx jsr publish"
    ]
  }
}
```

`scripts/sync-jsr-version.mjs` (repo root) reads `version` from `package.json` and writes
it to `jsr.json` before `jsr publish` runs. This is required because bumpy only bumps
`package.json`; JSR requires the version field in `jsr.json` and does not fall back to
`package.json`.

### 8.2 VSCode extensions

Extensions are not published to npm or JSR. The `"bumpy"` block in each extension's
`package.json`:

```json
{
  "bumpy": {
    "buildCommand": "vp pack",
    "publishCommand": "vsce publish",
    "skipNpmPublish": true
  }
}
```

### 8.4 Bump files

Bump files live in `.bumpy/`. Format:

```markdown
---
'@saeris/mdit-del': minor
'@saeris/remd-del': minor
---

Description of the change for the changelog.
```

Packages version independently. There is no synchronized versioning across the monorepo.

---

## 9. CI/CD

### 9.1 Continuous integration

Triggered on push and pull request to `main`.

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: voidzero-dev/setup-vp@v1
        with:
          node-version: "24"
          cache: true

      - run: vp check
      - run: vp test
```

> **Note:** Bumpy's own documentation examples use bun, but bumpy has no bun-specific
> behavior. The workflows below use `vp dlx` (Yarn via Vite+) instead.

### 9.2 Bumpy PR check

Posts a comment on each PR showing the projected version bump plan.

```yaml
name: Bumpy Check
on:
  pull_request:
    branches: [main]

jobs:
  bumpy-check:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - uses: actions/checkout@v4

      - uses: voidzero-dev/setup-vp@v1
        with:
          node-version: "24"
          cache: true

      - run: vp dlx @varlock/bumpy ci check
        env:
          GH_TOKEN: ${{ github.token }}
```

### 9.3 Bumpy release

Runs on push to `main`. Opens/updates a "Version Packages" PR when bump files are pending;
publishes when that PR merges.

```yaml
name: Release
on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      id-token: write  # required for npm and JSR OIDC trusted publishing
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: voidzero-dev/setup-vp@v1
        with:
          node-version: "24"
          cache: true

      - run: vp dlx @varlock/bumpy ci release
        env:
          GH_TOKEN: ${{ github.token }}
          BUMPY_GH_TOKEN: ${{ secrets.BUMPY_GH_TOKEN }}
          VSCE_PAT: ${{ secrets.VSCE_PAT }}
```

**Required secrets:**
- `BUMPY_GH_TOKEN` — Fine-grained PAT with Contents + Pull Requests write permissions.
  Needed so the "Version Packages" PR triggers CI workflows (the default `github.token`
  does not trigger other workflows due to GitHub's recursion guard).
- `VSCE_PAT` — VS Code Marketplace personal access token.

**One-time registry setup (per package, before first publish):**
- **npm:** Go to the package's settings on npmjs.com → Trusted Publishers → add this
  repository and the `release.yml` workflow filename.
- **JSR:** Go to the package's settings on jsr.io → Link GitHub repository.

---

## 10. Open items

- **`markdown-del` name conflict:** Check the VSCode Marketplace before publishing;
  rename if a conflicting extension already exists. Safe to proceed with this name during
  development — only matters at first publish time.
- **`markdown-superscript` name conflict:** Same check required.
- **`inline-svg` behavior skew:** Known skew between `remd-inline-svg` and
  `mdit-inline-svg`. Document as tracked issues; resolve after initial migration.

---

## 11. Implementation phases

Work through one feature set at a time within each phase. Resolve nuances per feature
before moving to the next.

### Phase 0 — Foundation
1. Fix `package.json` workspaces: `apps/*` → `docs/*`
2. Update root `tsconfig.json`: remove `jsx`/`jsxImportSource` from base config
3. Verify `bumpy ci release` + `jsr publish` round-trip (jsr.json version sync)
4. Author `.bumpy/_config.json` with publishing commands for all known packages
5. Set up GitHub Actions workflows (CI, Bumpy check, Release)

### Phase 1 — Package templates
Establish the canonical file shape for each package type before any migration:
- `packages/mdit-*/` template
- `packages/remd-*/` template
- `extensions/*/` template
- `tests/<name>/` template

### Phase 2 — First-party plugins (reference implementations)
Migrate in order: `del` first (simpler), then `inline-svg` (involves Rehype + behavior skew).

For each feature:
1. Copy source into `packages/remd-<name>/` and `packages/mdit-<name>/`
2. Strip changeset config, old CI, eslint/prettier (monorepo tools replace them)
3. Align `package.json`, `jsr.json`, `tsconfig.json`, `vite.config.ts` to templates
4. Migrate corresponding extension into `extensions/<name>/`; convert to TypeScript
5. Write `tests/<name>/` suite with fixtures and expected HTML
6. Confirm `vp pack`, `vp test`, `vp check` all pass

`del` specifically: create `extensions/markdown-del/` (does not exist yet).

### Phase 3 — Forks (third-party plugins)
Work through waves in order of ascending complexity. One feature set at a time.

- **Wave 1:** `ins`, `mark` — simple inline syntax
- **Wave 2:** `kbd`, `sub`, `sup`, `abbr` — inline with more nuance
- **Wave 3:** `definition-list`, `github-alerts`, `attrs`, `ruby` — block-level or structural
- **Wave 4:** `unwrap-images` — transforms existing nodes

For each fork:
1. Copy source from upstream (do not use git subtree or submodules)
2. Rename to convention, convert to TypeScript, convert to ESM-only
3. Strip unnecessary upstream dependencies (audit runtime vs dev needs)
4. Align to package templates
5. Write test suite; adapt upstream test cases as fixture starting points
6. Migrate corresponding extension; update bundled dep to workspace ref

### Phase 4 — Extension pack
Migrate `markdown-preview-extended-syntax` into `extensions/`. The pack's
`extensionDependencies` lists Marketplace IDs — these are stable and unchanged.

### Phase 5 — Test suite hardening + integration audit
1. Ensure every feature has fixture coverage: basic usage, edge cases, escaping,
   nesting with standard Markdown (bold, links, etc.)
2. Add CI check: fail if a remd or mdit package has no corresponding test directory
3. Integration audit: add tests for common multi-plugin scenarios, prioritizing:
   - `attrs` combined with other inline plugins
   - `ruby` combined with emphasis, strong, `mark`
   - Other common combinations as discovered
4. Abstraction pass on `tests/utils/` (after ≥3 plugin pairs provide a sample)

### Phase 6 — Documentation site
Set up Astro in `docs/`. One page per feature covering: syntax reference, rendered
examples, install instructions for both remd and mdit variants, VSCode extension link.
The docs Astro config consumes our own `remd-*` plugins for page rendering.

Tabbed code preview UI (à la Vocs) is **deferred** until we have our own plugin pair
for it.

### Phase 7 — Publishing pipeline verification
End-to-end test of the full bumpy + npm + JSR + vsce release flow. Resolve any
jsr.json version sync issues found in Phase 0.

---

## 12. Toolchain reference

| Tool | Invocation | Purpose |
|---|---|---|
| Vite+ | `vp` | Unified CLI — do not invoke underlying tools directly |
| Build (libraries) | `vp pack` | tsdown/Rolldown — produces dist/ |
| Type check | `vp check` | oxlint + oxfmt + TypeScript |
| Test | `vp test` | Vitest |
| Install | `vp install` or `vp i` | Yarn (detected via packageManager field) |
| One-off binary | `vp dlx <pkg>` | Equivalent to npx/yarn dlx |
| Bumpy | `vp dlx @varlock/bumpy` | Version management and publishing |
| JSR | `vp dlx jsr` | JSR publish |
| vsce | `vp dlx @vscode/vsce` | VSCode Marketplace publish |

**Import rule:** Always import from `vite-plus`, never from `vite` or `vitest` directly.

```ts
import { defineConfig } from 'vite-plus';
import { expect, test, describe } from 'vite-plus/test';
```

---

## 13. Constraints

- **ESM-only:** All plugin packages. `"type": "module"` in `package.json`. No CJS output.
- **Node 24+:** `"engines": { "node": ">=24.0.0" }` in all published packages.
- **Minimal dependencies:** Only runtime-required dependencies. No bundling of peer deps
  in plugin packages. Reduces install footprint and supply-chain attack surface.
- **No web APIs in plugins:** mdit and remd packages must not use browser APIs.
  Extensions must not use Node.js APIs (web extension host compatibility).
- **Named exports only:** No default exports from plugin packages.
- **No comments in code** unless the why is non-obvious (hidden constraint, subtle
  invariant, specific bug workaround).
