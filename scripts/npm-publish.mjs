#!/usr/bin/env node
/* oxlint-disable no-console */
// Idempotent npm publish. Builds the dist, packs a tarball (resolving
// catalog:/workspace: for the published manifest) and publishes — but ONLY when
// the version isn't already on the registry. So a retry, or a JSR-only recovery,
// skips the build + pack + publish entirely. JSR publishes from source, so the
// dist build belongs here: it's needed for npm and nothing else.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const { name, version } = JSON.parse(readFileSync("package.json", "utf8"));

let onRegistry = false;
try {
  execSync(`npm view ${name}@${version} version`, { stdio: "ignore" });
  onRegistry = true;
} catch {
  /* not published yet */
}

if (onRegistry) {
  console.log(`  ${name}@${version} already on npm — skipping build + publish`);
} else {
  execSync("vp pack", { stdio: "inherit" });
  execSync("yarn pack -o package.tgz", { stdio: "inherit" });
  execSync("npm publish package.tgz --access public", { stdio: "inherit" });
}
