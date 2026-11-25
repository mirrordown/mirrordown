#!/usr/bin/env node
// Checks the built VS Code extensions before they are published. An extension ships as one bundled file: VS Code gives it nothing to `require` but `vscode`, so an import the bundler could not resolve, which it leaves in the bundle as an external `require` with only a warning, makes the extension fail to load for everyone who installs it. That happened on 2026-11-25: nine extensions were published with `require("@mirrordown/core")`, because the release built the `mdit-*` packages before bundling and not the core package they import.
//
// For every extension with code, each bundle its manifest names must exist and may require nothing but `vscode`, and each preview script it names must exist. Stylesheets are not checked: the release build writes them after bundling.
//
// Usage: node scripts/check-extension-bundles.mjs   (after `vp pack` in the extensions; exits 1 on any fault)

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const extensionsDir = join(repoRoot, "extensions");
const ALLOWED = new Set(["vscode"]);
const REQUIRE = /\brequire\(\s*["'`]([^"'`]+)["'`]\s*\)/g;

const faults = [];
let checked = 0;

for (const name of readdirSync(extensionsDir).sort()) {
  const manifestPath = join(extensionsDir, name, "package.json");
  if (!existsSync(manifestPath)) continue;
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const bundles = [...new Set([manifest.main, manifest.browser])].filter(
    Boolean
  );
  // The pack has no code of its own.
  if (bundles.length === 0) continue;
  checked++;

  for (const bundle of bundles) {
    const path = join(extensionsDir, name, bundle);
    if (!existsSync(path)) {
      faults.push(`${name}: ${bundle} does not exist (was it built?)`);
      continue;
    }
    const required = new Set(
      [...readFileSync(path, "utf8").matchAll(REQUIRE)].map((match) => match[1])
    );
    for (const id of required)
      if (!ALLOWED.has(id))
        faults.push(
          `${name}: ${bundle} requires "${id}", which is not in the bundle`
        );
  }

  for (const script of manifest.contributes?.["markdown.previewScripts"] ??
    []) {
    if (!existsSync(join(extensionsDir, name, script)))
      faults.push(
        `${name}: the manifest names the preview script ${script}, which does not exist`
      );
  }
}

if (faults.length > 0) {
  console.error(
    `${faults.length} fault(s) in the extension bundles:\n${faults.map((fault) => `  ${fault}`).join("\n")}`
  );
  console.error(
    `\nAn unbundled require means the package it names was not built before the extension was bundled.`
  );
  process.exit(1);
}
console.log(
  `${checked} extension bundles checked: each requires nothing but vscode.`
);
