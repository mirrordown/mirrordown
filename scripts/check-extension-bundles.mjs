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

/** The faults of one bundle: missing, or requiring something it does not contain. */
const bundleFaults = (name, bundle) => {
  const path = join(extensionsDir, name, bundle);
  if (!existsSync(path)) {
    return [`${name}: ${bundle} does not exist (was it built?)`];
  }
  const required = new Set(
    [...readFileSync(path, "utf8").matchAll(REQUIRE)].map((match) => match[1])
  );
  return [...required]
    .filter((id) => !ALLOWED.has(id))
    .map(
      (id) => `${name}: ${bundle} requires "${id}", which is not in the bundle`
    );
};

/** The faults of one extension, or `null` for a folder with no code to check (the pack, or no manifest). */
const extensionFaults = (name) => {
  const manifestPath = join(extensionsDir, name, "package.json");
  if (!existsSync(manifestPath)) {
    return null;
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const bundles = [...new Set([manifest.main, manifest.browser])].filter(
    Boolean
  );
  if (bundles.length === 0) {
    return null;
  }
  const scripts = manifest.contributes?.["markdown.previewScripts"] ?? [];
  return [
    ...bundles.flatMap((bundle) => bundleFaults(name, bundle)),
    ...scripts
      .filter((script) => !existsSync(join(extensionsDir, name, script)))
      .map(
        (script) =>
          `${name}: the manifest names the preview script ${script}, which does not exist`
      )
  ];
};

const results = readdirSync(extensionsDir)
  .sort()
  .map(extensionFaults)
  .filter((faults) => faults !== null);
const faults = results.flat();

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
  `${results.length} extension bundles checked: each requires nothing but vscode.`
);
