#!/usr/bin/env node
/* oxlint-disable no-console */
// Idempotent JSR publish. `npx jsr publish` runs deno's doc generation, which is
// the slowest step of a release; skip it when the version is already on JSR so
// retries (and partial-failure recovery) don't redo it. JSR publishes from
// source via jsr.json, so there's no dist build here.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const { name, version } = JSON.parse(readFileSync("package.json", "utf8"));
const [, scope, pkg] = name.match(/^@([^/]+)\/(.+)$/) ?? [];

let onRegistry = false;
try {
  const res = await fetch(
    `https://api.jsr.io/scopes/${scope}/packages/${pkg}/versions/${version}`
  );
  onRegistry = res.status === 200;
} catch {
  /* network hiccup — fall through and let publish decide */
}

if (onRegistry) {
  console.log(`  ${name}@${version} already on JSR — skipping`);
} else {
  execSync("npx jsr publish --allow-dirty --allow-slow-types", {
    stdio: "inherit"
  });
}
