#!/usr/bin/env node
// Prints which packages use which `packages/core/src` modules, so a change to a core module can be given to one owner and its dependents tested. Packages import core by name (`@mirrordown/core`), so each imported name is traced to the module that defines it through core's entry files; core modules that import that module are listed with their own packages.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HELP = `Which packages use which core modules.

Usage:
  node scripts/core-users.mjs                       Every core module and the packages that import it.
  node scripts/core-users.mjs tabs                  Only modules whose path contains "tabs".
  node scripts/core-users.mjs --package mdit-tabs   The modules one package imports.
  node scripts/core-users.mjs --tests tabs          The tests/<set> folders to run first after changing those modules.`;

const args = process.argv.slice(2);
if (args.includes(`--help`) || args.includes(`-h`)) {
  console.log(HELP);
  process.exit(0);
}
// A flag's value, or `null` when the flag was not given.
const flagValue = (flag) => {
  const index = args.indexOf(flag);
  return index === -1 ? null : (args[index + 1] ?? ``);
};
const pkgArg = flagValue(`--package`);
const testsArg = flagValue(`--tests`);
const firstWord = args.find((arg) => !arg.startsWith(`--`)) ?? ``;
const filter = testsArg ?? (pkgArg === null ? firstWord : ``);

const root = join(dirname(fileURLToPath(import.meta.url)), `..`);
const coreDir = join(root, `packages`, `core`);
const coreSrc = join(coreDir, `src`);
const moduleName = (file) => relative(coreSrc, file).replaceAll(`\\`, `/`);
const byName = (a, b) => a.localeCompare(b);

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return walk(path);
    }
    return /\.(ts|mts)$/.test(name) && !name.endsWith(`.d.ts`) ? [path] : [];
  });

// A relative import as written (`./escapes.js`, `../github-alerts/index.js`) to the source file it names, or `null`.
const resolveRelative = (from, specifier) => {
  if (!specifier.startsWith(`.`)) {
    return null;
  }
  const base = join(dirname(from), specifier.replace(/\.m?js$/, ``));
  return (
    [`${base}.ts`, join(base, `index.ts`)].find((path) => existsSync(path)) ??
    null
  );
};

// The names in an import or export clause: `source` is the name in the module it comes from, `exposed` the name it has here.
const names = (clause) =>
  clause
    .split(`,`)
    .map((part) => part.trim().replace(/^type\s+/, ``))
    .filter(Boolean)
    .map((part) => {
      const [source, alias] = part.split(/\s+as\s+/);
      return { source: source.trim(), exposed: (alias ?? source).trim() };
    });

const NAMED_FROM =
  /(import|export)\s+(?:type\s+)?\{([^}]*)\}\s*from\s*["']([^"']+)["']/g;
const STAR_FROM = /export\s+\*\s+from\s*["']([^"']+)["']/g;
const LOCAL_EXPORT = /export\s+(?:type\s+)?\{([^}]*)\}(?!\s*from)/g;
const DECLARED =
  /export\s+(?:declare\s+)?(?:const|function|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g;
const ANY_FROM = /(?:import|export)\s[^;]*?from\s*["'](\.[^"']+)["']/g;

// For one core file: each exported name mapped to the file that defines it, following re-exports.
const cache = new Map();
const exportsOf = (file, stack = new Set()) => {
  const cached = cache.get(file);
  if (cached) {
    return cached;
  }
  const defined = new Map();
  if (stack.has(file)) {
    return defined;
  }
  stack.add(file);
  const source = readFileSync(file, `utf8`);
  // Names imported from another core file, in case they are passed on by a bare `export { A }`.
  const imported = new Map();
  for (const [, kind, clause, specifier] of source.matchAll(NAMED_FROM)) {
    const target = resolveRelative(file, specifier);
    if (target) {
      const inner = exportsOf(target, stack);
      const into = kind === `export` ? defined : imported;
      for (const { source: name, exposed } of names(clause)) {
        into.set(exposed, inner.get(name) ?? target);
      }
    }
  }
  for (const [, specifier] of source.matchAll(STAR_FROM)) {
    const target = resolveRelative(file, specifier);
    if (target) {
      for (const [name, origin] of exportsOf(target, stack)) {
        defined.set(name, origin);
      }
    }
  }
  for (const [, name] of source.matchAll(DECLARED)) {
    defined.set(name, file);
  }
  for (const [, clause] of source.matchAll(LOCAL_EXPORT)) {
    for (const { source: name, exposed } of names(clause)) {
      if (!defined.has(exposed)) {
        defined.set(exposed, imported.get(name) ?? file);
      }
    }
  }
  stack.delete(file);
  cache.set(file, defined);
  return defined;
};

// Core's entry points, from its package.json: the specifier a package imports and the names it leads to.
const manifest = JSON.parse(
  readFileSync(join(coreDir, `package.json`), `utf8`)
);
const entryExports = new Map(
  Object.entries(manifest.exports)
    .filter(([, target]) => typeof target?.development === `string`)
    .map(([subpath, target]) => [
      `@mirrordown/core${subpath === `.` ? `` : subpath.slice(1)}`,
      exportsOf(join(coreDir, target.development))
    ])
);

// Core module → the packages that import a name it defines.
const users = new Map();
const unresolved = [];
const packages = readdirSync(join(root, `packages`)).filter(
  (pkg) => pkg !== `core` && existsSync(join(root, `packages`, pkg, `src`))
);
for (const pkg of packages) {
  for (const file of walk(join(root, `packages`, pkg, `src`))) {
    for (const [, , clause, specifier] of readFileSync(file, `utf8`).matchAll(
      NAMED_FROM
    )) {
      const defined = entryExports.get(specifier);
      // Only imports from core are looked at; a name core does not export is reported, not dropped.
      const imported = specifier.startsWith(`@mirrordown/core`)
        ? names(clause)
        : [];
      for (const { source: name } of imported) {
        const origin = defined?.get(name);
        if (origin) {
          const module = moduleName(origin);
          users.set(module, (users.get(module) ?? new Set()).add(pkg));
        } else {
          unresolved.push(`${pkg}: ${name} from ${specifier}`);
        }
      }
    }
  }
}

// Core module → the core modules it imports. The root entry file only re-exports the others, so it is left out: through it every module would seem to reach every package.
const imports = new Map(
  walk(coreSrc)
    .filter((file) => moduleName(file) !== `index.ts`)
    .map((file) => [
      moduleName(file),
      new Set(
        [...readFileSync(file, `utf8`).matchAll(ANY_FROM)]
          .map(([, specifier]) => resolveRelative(file, specifier))
          .filter(Boolean)
          .map(moduleName)
      )
    ])
);

// The core modules that import `module` themselves. Only one step is followed: core modules import one another widely (a constant here, a type there), so the full chain reaches nearly every package and says nothing.
const importers = (module) =>
  [...imports]
    .filter(([, targets]) => targets.has(module))
    .map(([other]) => other)
    .sort(byName);

const packagesOf = (module) => [...(users.get(module) ?? [])].sort(byName);

const modules = [...imports.keys()].sort(byName);
const matching = modules.filter((module) => module.includes(filter));

if (pkgArg !== null) {
  console.log(
    modules.filter((module) => users.get(module)?.has(pkgArg)).join(`\n`)
  );
} else if (testsArg === null) {
  for (const module of matching) {
    console.log(module);
    console.log(
      `  packages: ${packagesOf(module).join(` `) || `(none directly)`}`
    );
    for (const other of importers(module)) {
      console.log(
        `  through ${other}: ${packagesOf(other).join(` `) || `(none directly)`}`
      );
    }
  }
} else {
  // A package `mdit-tabs` is tested in `tests/tabs`; the presets compose everything. This is where to look first after a change, not the whole of what it can affect: run the full suite before calling a core change done.
  const sets = new Set([
    `presets`,
    ...matching
      .flatMap((module) => [module, ...importers(module)])
      .flatMap(packagesOf)
      .map((pkg) => pkg.replace(/^(mdit|remd|sat)-/, ``))
  ]);
  console.log(
    [...sets]
      .filter((set) => existsSync(join(root, `tests`, set)))
      .sort(byName)
      .map((set) => `tests/${set}`)
      .join(` `)
  );
}
if (unresolved.length > 0) {
  console.error(
    `\nNot traced to a module (${unresolved.length}):\n  ${unresolved.join(`\n  `)}`
  );
  process.exitCode = 1;
}
