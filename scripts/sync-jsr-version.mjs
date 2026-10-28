// Sync jsr.json versions to package.json before `jsr publish`, for every workspace package, not only the one being published (which is among them). Deno reads a workspace dependency linked into node_modules as a JSR package at the version in its own jsr.json, so a dependency that isn't republished in the same release would otherwise be required at the committed `0.0.0` ("unresolvable 'jsr:' dependency: '@mirrordown/mdit-abbr@^0.0.0'"). Only the CI checkout changes; nothing is committed.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

for (const dir of readdirSync(join(root, "packages"))) {
  const manifest = join(root, "packages", dir, "package.json");
  const jsrManifest = join(root, "packages", dir, "jsr.json");
  if (existsSync(manifest) && existsSync(jsrManifest)) {
    const pkg = JSON.parse(readFileSync(manifest, "utf8"));
    const jsr = JSON.parse(readFileSync(jsrManifest, "utf8"));
    if (jsr.version !== pkg.version) {
      jsr.version = pkg.version;
      writeFileSync(jsrManifest, `${JSON.stringify(jsr, null, 2)}\n`);
    }
  }
}
