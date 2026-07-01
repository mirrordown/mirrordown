#!/usr/bin/env node
/* oxlint-disable no-await-in-loop, no-console */
// Set JSR package metadata that lifts the package score but isn't carried in the
// published tarball: a description and runtime-compatibility flags. Both apply
// via the JSR management API (PATCH), so they take effect immediately with no
// republish. Mirrors jsr-claim's auth + rate-limit handling.
//
// runtimeCompat is inferred from the source: a package that imports `node:`
// builtins is marked server-only (node/deno/bun); everything else — these are
// pure AST transformers — is also marked browser- and workerd-compatible.
//
// Auth: a full-access JSR token in JSR_TOKEN (jsr.io -> Tokens), used once,
// locally — it does NOT go into CI. Not needed for --dry-run. Keep it in your
// personal ~/.env (loaded by ./load-env.mjs); an explicit `JSR_TOKEN=… node …`
// (POSIX) still overrides it.
//
// Usage (cross-platform):
//   node scripts/jsr-meta.mjs
//   node scripts/jsr-meta.mjs --dry-run
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
// Side-effect import: loads ~/.env into process.env. Runs during the import
// phase (before any top-level code reads JSR_TOKEN), so its position among the
// imports doesn't matter — the node: imports above don't touch process.env.
import "./load-env.mjs";

const API = "https://api.jsr.io";
const MAX_RETRIES = 6; // 429 backoff attempts
const COOLDOWN_MS = 1000; // pause between packages to ease JSR's rate limit
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const dryRun = process.argv.includes("--dry-run");
const token = process.env.JSR_TOKEN;

// A package that imports `node:` builtins (e.g. inline-svg reads .svg files) is
// not browser/workerd compatible.
function usesNodeBuiltins(srcDir) {
  return readdirSync(srcDir).some(
    (f) =>
      f.endsWith(".ts") &&
      /from "node:|require\("node:/.test(readFileSync(join(srcDir, f), "utf8"))
  );
}

const targets = readdirSync(join(repoRoot, "packages"))
  .map((d) => join(repoRoot, "packages", d))
  .filter((dir) => existsSync(join(dir, "package.json")))
  .map((dir) => {
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    const [, scope, name] = (pkg.name ?? "").match(/^@([^/]+)\/(.+)$/) ?? [];
    const src = join(dir, "src");
    const serverOnly = existsSync(src) && usesNodeBuiltins(src);
    return {
      scope,
      pkg: name,
      fullName: pkg.name,
      private: pkg.private === true,
      description: pkg.description,
      runtimeCompat: {
        node: true,
        deno: true,
        bun: true,
        browser: !serverOnly,
        workerd: !serverOnly
      }
    };
  })
  .filter((t) => !t.private && t.scope && t.pkg)
  .sort((a, b) => a.fullName.localeCompare(b.fullName));

// JSR's management API is aggressively rate-limited, so back off + retry.
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

const patch = (t, body) =>
  jsr("PATCH", `/scopes/${t.scope}/packages/${t.pkg}`, body);

/** Confirm the token can manage the scope (200 = member), else fail fast. */
async function assertScopeAccess(scope) {
  const res = await jsr("GET", `/user/member/${scope}`);
  if (res.status === 200) return;
  const why =
    res.status === 401
      ? "the token is invalid or expired"
      : `you don't have access to @${scope} (HTTP ${res.status})`;
  console.log(`  cannot manage @${scope}: ${why}. Use a full-access token.`);
  process.exit(1);
}

const runtimeList = (rc) =>
  Object.entries(rc)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join("+");

console.log(`${dryRun ? "[dry-run] " : ""}${targets.length} package(s)\n`);
if (!token && !dryRun) {
  console.log(
    "  JSR_TOKEN not set — create a full-access token (jsr.io -> Tokens) and re-run."
  );
  process.exit(1);
}
if (!dryRun) await assertScopeAccess(targets[0].scope);

const failures = [];
for (const t of targets) {
  if (dryRun) {
    console.log(
      `  ${t.fullName}\n    desc: ${t.description}\n    runtimes: ${runtimeList(t.runtimeCompat)}`
    );
  } else {
    try {
      const d = await patch(t, { description: t.description });
      if (!d.ok) throw new Error(`description (${d.status}): ${d.body}`);
      const r = await patch(t, { runtimeCompat: t.runtimeCompat });
      if (!r.ok) throw new Error(`runtimeCompat (${r.status}): ${r.body}`);
      console.log(`  ✓ ${t.fullName} — ${runtimeList(t.runtimeCompat)}`);
    } catch (err) {
      console.log(`  ✗ ${t.fullName}: ${err.message}`);
      failures.push(t.fullName);
    }
    await sleep(COOLDOWN_MS);
  }
}

if (!dryRun) {
  const failed = failures.length ? `, failed: ${failures.join(", ")}` : "";
  const ok = targets.length - failures.length;
  console.log(`\ndone — ${ok}/${targets.length} ok${failed}`);
}
process.exit(failures.length ? 1 : 0);
