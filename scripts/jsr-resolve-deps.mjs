#!/usr/bin/env node
// Prepare package.json for `jsr publish`. JSR (deno --unstable-byonm) reads npm
// dependencies from package.json, but a `catalog:` specifier is an *invalid
// version* to deno: it silently drops that dependency, which then breaks
// resolving the matching imports ("Failed resolving './markdown-it'…").
//
// Resolve each `catalog:` to its concrete range from the workspace catalog in
// .yarnrc.yml. (Reads the catalog directly rather than a `yarn pack` tarball, so
// JSR publishing doesn't depend on having packed for npm — see npm-publish.mjs,
// which now packs lazily.) Runs in the package dir; the working src/ that JSR
// publishes is untouched.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Parse the flat `catalog:` block (key: value) from .yarnrc.yml.
const catalog = {};
let inCatalog = false;
for (const line of readFileSync(join(root, ".yarnrc.yml"), "utf8").split(
  "\n"
)) {
  if (/^catalog:\s*$/.test(line)) {
    inCatalog = true;
  } else if (inCatalog) {
    if (/^\S/.test(line)) break; // next top-level key ends the block
    const m = line.match(/^\s+"?([^":\s]+)"?:\s*"?([^"\s]+)"?\s*$/);
    if (m) catalog[m[1]] = m[2];
  }
}

// Workspace packages a package depends on (e.g. `@mirrordown/core`) use the
// `workspace:` protocol, which deno can't read either. `yarn pack` rewrites it
// for npm; do the same here from each workspace package's current version.
const workspace = {};
for (const dir of readdirSync(join(root, "packages"))) {
  const manifest = join(root, "packages", dir, "package.json");
  if (existsSync(manifest)) {
    const { name, version } = JSON.parse(readFileSync(manifest, "utf8"));
    workspace[name] = version;
  }
}
const resolveWorkspace = (name, spec) => {
  const version = workspace[name];
  if (!version) throw new Error(`No workspace package "${name}"`);
  const range = spec.slice("workspace:".length);
  if (range === "*") return version;
  if (range === "^" || range === "~") return `${range}${version}`;
  return range;
};

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
for (const field of [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies"
]) {
  for (const [name, spec] of Object.entries(pkg[field] ?? {})) {
    if (spec === "catalog:") {
      if (!catalog[name]) throw new Error(`No catalog entry for "${name}"`);
      pkg[field][name] = catalog[name];
    } else if (spec.startsWith("workspace:")) {
      pkg[field][name] = resolveWorkspace(name, spec);
    }
  }
}

writeFileSync("package.json", `${JSON.stringify(pkg, null, 2)}\n`);
