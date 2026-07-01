#!/usr/bin/env node
/* oxlint-disable no-await-in-loop, no-console */
// ---------------------------------------------------------------------------
// jsr-claim — bootstrap a monorepo's packages for first-time publishing to JSR
// ---------------------------------------------------------------------------
// A complete first-publish setup, in two phases:
//
//   1. SCAFFOLD   ensure every package has a correct jsr.json (name, version,
//                 exports), created from its package.json if missing or fixed
//                 if it has drifted.
//   2. CLAIM      via the JSR management API (https://api.jsr.io), for each
//                 package:
//                   - exists?     GET   /scopes/{scope}/packages/{pkg}  (404 = free)
//                   - claim       POST  /scopes/{scope}/packages        { package }
//                   - link repo   PATCH /scopes/{scope}/packages/{pkg}  { githubRepository }
//
// JSR has no "create on first publish", so every package must be claimed up
// front. Linking the repo is what lets GitHub Actions publish *token-lessly via
// OIDC* afterwards (`npx jsr publish`, no JSR_TOKEN secret in CI) — the JSR
// analogue of npm trusted publishing. This mirrors what `fledgling` does for npm.
//
// Heads up — two JSR limits this handles: the management API is rate-limited
// (we back off + cool down), and a scope may only create 20 NEW packages per
// rolling week (we stop and report the rest; re-run later or request a raise).
//
// Auth: a JSR personal access token (jsr.io → account → Tokens), in JSR_TOKEN.
// It must be FULL access — a token restricted to "package publish" can publish
// versions but NOT create packages or link a repo (those are management ops),
// so it returns 403 missingPermission. Used once, locally — it does NOT go into
// CI (publishing afterwards is OIDC, token-less). Not needed for --dry-run.
//
// Usage (cross-platform — the token is read from ~/.env, see below):
//   node scripts/jsr-claim.mjs                              # scaffold + claim
//   node scripts/jsr-claim.mjs --dry-run                    # show the plan only
//   [--repo owner/name]   override the GitHub repo (default: git remote origin)
//
// Auth token: put `JSR_TOKEN=jsr_xxx` in your personal ~/.env (loaded by
// ./load-env.mjs). An explicit `JSR_TOKEN=… node …` (POSIX) still overrides it.
//
// Targets are every non-private package under packages/*/package.json.
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// Side-effect import: loads ~/.env into process.env. Runs during the import
// phase (before any top-level code reads JSR_TOKEN), so its position among the
// imports doesn't matter — the node: imports above don't touch process.env.
import "./load-env.mjs";

const API = "https://api.jsr.io";
const MAX_RETRIES = 6; // 429 backoff attempts per request
const COOLDOWN_MS = 1000; // pause between packages to ease JSR's rate limit
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const repoIdx = args.indexOf("--repo");
let repoArg;
if (repoIdx >= 0) repoArg = args[repoIdx + 1];

const token = process.env.JSR_TOKEN;

// ── Discover targets (from package.json, so missing jsr.json is fine) ────────
// JSR publishes the TS source, so the export points at ./src/index.ts (the
// package's `development`/source condition), not the built dist.
function sourceEntry(pkg) {
  const dot = pkg.exports?.["."];
  if (typeof dot === "string") return dot;
  return dot?.development ?? dot?.source ?? "./src/index.ts";
}

const targets = readdirSync(join(repoRoot, "packages"))
  .map((d) => ({ dir: join(repoRoot, "packages", d) }))
  .filter((t) => existsSync(join(t.dir, "package.json")))
  .map((t) => {
    const pkg = JSON.parse(readFileSync(join(t.dir, "package.json"), "utf8"));
    const [, scope, name] = (pkg.name ?? "").match(/^@([^/]+)\/(.+)$/) ?? [];
    return {
      ...t,
      private: pkg.private === true,
      scope,
      pkg: name,
      fullName: pkg.name,
      version: pkg.version ?? "0.0.0",
      entry: sourceEntry(pkg)
    };
  })
  .filter((t) => !t.private && t.scope && t.pkg)
  .sort((a, b) => a.fullName.localeCompare(b.fullName));

if (!targets.length) {
  console.error("No publishable @scope/name packages found under packages/*.");
  process.exit(1);
}

// ── GitHub repo (owner/name) to link ───────────────────────────────────────
function resolveRepo() {
  if (repoArg) {
    const [owner, name] = repoArg.split("/");
    return { owner, name };
  }
  const url = execSync("git remote get-url origin", {
    cwd: repoRoot,
    encoding: "utf8"
  }).trim();
  // handles git@github.com:owner/name.git and https://github.com/owner/name(.git)
  const m = url.match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/);
  if (!m) throw new Error(`Could not parse a GitHub owner/name from: ${url}`);
  return { owner: m[1], name: m[2] };
}
const repo = resolveRepo();

// ── Phase 1: scaffold / validate jsr.json ───────────────────────────────────
// Owns the manifest *structure* (name + exports); creating one also seeds the
// current version. Version stays in sync at publish time via sync-jsr-version.
//
// An EXISTING jsr.json `.` export is authoritative and preserved: some remd-*
// packages deliberately point their JSR entry at `./src/jsr.ts` (not index.ts)
// to keep module augmentation — which JSR rejects — out of the public API. This
// scaffolder only supplies a default entry when CREATING a manifest or when the
// existing one has no usable `.` export; it never rewrites a valid one.
function hasValidDotExport(exports) {
  const dot = exports?.["."];
  return typeof dot === "string" && dot.length > 0;
}
function ensureManifest(t) {
  const file = join(t.dir, "jsr.json");
  if (!existsSync(file)) {
    if (!dryRun) {
      const manifest = {
        name: t.fullName,
        version: t.version,
        exports: { ".": t.entry }
      };
      writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
    }
    return "created";
  }
  const cur = JSON.parse(readFileSync(file, "utf8"));
  // Keep the existing exports if they're valid; only synthesize a default when
  // missing/empty. This protects intentional `./src/jsr.ts` entries.
  const exports = hasValidDotExport(cur.exports)
    ? cur.exports
    : { ".": t.entry };
  const drifted =
    cur.name !== t.fullName ||
    JSON.stringify(cur.exports) !== JSON.stringify(exports);
  if (!drifted) return "ok";
  if (!dryRun) {
    writeFileSync(
      file,
      `${JSON.stringify({ ...cur, name: t.fullName, exports }, null, 2)}\n`
    );
  }
  return "fixed";
}

// ── Phase 2: JSR API ────────────────────────────────────────────────────────
// JSR's management API is aggressively rate-limited (bulk claims hit 429 fast),
// so back off and retry — honouring Retry-After when present, else exponential.
async function jsr(method, path, body, attempt = 0) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body ? { "content-type": "application/json" } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  if (res.status === 429 && attempt < MAX_RETRIES) {
    const retryAfter = Number(res.headers.get("retry-after"));
    const wait =
      Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : Math.min(1000 * 2 ** attempt, 30_000);
    console.log(`    rate limited — waiting ${Math.round(wait / 1000)}s…`);
    await sleep(wait);
    return jsr(method, path, body, attempt + 1);
  }
  return { status: res.status, ok: res.ok, body: await res.text() };
}

/** Confirm the token can manage the scope (200 = member), else fail fast. */
async function assertScopeAccess(scope) {
  const res = await jsr("GET", `/user/member/${scope}`);
  if (res.status === 200) return;
  const why =
    res.status === 401
      ? "the token is invalid or expired"
      : `you don't have access to @${scope} (HTTP ${res.status})`;
  console.log(
    `  cannot manage @${scope}: ${why}. Use a full-access token for a scope you're a member of.`
  );
  process.exit(1);
}

const exists = async (s, p) =>
  (await jsr("GET", `/scopes/${s}/packages/${p}`)).status === 200;

const createPackage = (s, p) =>
  jsr("POST", `/scopes/${s}/packages`, { package: p });

const linkRepo = (s, p) =>
  jsr("PATCH", `/scopes/${s}/packages/${p}`, {
    githubRepository: { owner: repo.owner, name: repo.name }
  });

// ── Run ────────────────────────────────────────────────────────────────────
console.log(
  `${dryRun ? "[dry-run] " : ""}${targets.length} package(s) for @${targets[0].scope}, repo ${repo.owner}/${repo.name}\n`
);

console.log("jsr.json:");
for (const t of targets) {
  const action = ensureManifest(t);
  if (action !== "ok") console.log(`  ${action.padEnd(8)} ${t.fullName}`);
}

console.log("\nclaim + link:");
if (!token && !dryRun) {
  console.log(
    "  JSR_TOKEN not set — jsr.json scaffolded; create a full-access token\n" +
      "  (jsr.io → Tokens) and re-run to claim + link on JSR."
  );
  process.exit(0);
}
if (!dryRun) await assertScopeAccess(targets[0].scope);

// JSR caps NEW packages at 20 per scope per rolling week. Once hit, every
// remaining create fails the same way, so we stop and report rather than grind.
const isWeeklyLimit = (r) =>
  r.status === 400 && r.body.includes("weeklyPackageLimitExceeded");

const failures = [];
let stoppedAt = -1;
for (let i = 0; i < targets.length; i++) {
  const t = targets[i];
  try {
    const already = await exists(t.scope, t.pkg);
    if (dryRun) {
      console.log(
        `  ${already ? "exists, would link " : "would claim + link"}  ${t.fullName}`
      );
    } else if (already) {
      const link = await linkRepo(t.scope, t.pkg);
      if (!link.ok) {
        throw new Error(`link failed (${link.status}): ${link.body}`);
      }
      console.log(`  ✓ linked   ${t.fullName}`);
    } else {
      const r = await createPackage(t.scope, t.pkg);
      if (!r.ok) {
        if (isWeeklyLimit(r)) {
          stoppedAt = i;
          break;
        }
        throw new Error(`create failed (${r.status}): ${r.body}`);
      }
      const link = await linkRepo(t.scope, t.pkg);
      if (!link.ok) {
        throw new Error(`link failed (${link.status}): ${link.body}`);
      }
      console.log(`  ✓ claimed  ${t.fullName}`);
    }
  } catch (err) {
    console.log(`  ✗ ${t.fullName}: ${err.message}`);
    failures.push(t.fullName);
  }
  if (!dryRun) await sleep(COOLDOWN_MS);
}

const blocked =
  stoppedAt >= 0 ? targets.slice(stoppedAt).map((t) => t.fullName) : [];
if (blocked.length) {
  console.log(
    `\n  ⚠ JSR weekly limit reached — at most 20 NEW packages per scope per week.\n  ${blocked.length} not yet claimed:`
  );
  for (const name of blocked) console.log(`      ${name}`);
  console.log(
    `  Re-run after the quota resets (rolling week) or request an increase at\n  jsr.io. Re-running is safe — already-claimed packages are skipped.`
  );
}

if (dryRun) {
  console.log("\ndry-run complete");
} else {
  const ok = targets.length - failures.length - blocked.length;
  const parts = [`${ok}/${targets.length} ok`];
  if (blocked.length) parts.push(`${blocked.length} blocked (weekly limit)`);
  if (failures.length) {
    parts.push(`${failures.length} failed: ${failures.join(", ")}`);
  }
  console.log(`\ndone — ${parts.join(", ")}`);
}
process.exit(failures.length || blocked.length ? 1 : 0);
