#!/usr/bin/env node
// Runs every check a change needs, in the order that makes each one meaningful, and reports all of them even when an early one fails. `vp check` alone stops at formatting, and its type check reads each package's built types, so a stale build passes silently: hence the build first.
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HELP = `Build, format check, lint and type check, then tests, reporting every stage.

Usage:
  node scripts/verify.mjs [--no-build] [--no-tests] [test filters…]

  --no-build     Skip the package build (only when the build is known to be current).
  --no-tests     Skip the test run.
  test filters   Passed to \`vp test run\`, such as tests/tags. Default: the whole suite.

Exit code: 0 when every stage passed, 1 otherwise.`;

const args = process.argv.slice(2);
if (args.includes(`--help`) || args.includes(`-h`)) {
  console.log(HELP);
  process.exit(0);
}
const filters = args.filter((arg) => !arg.startsWith(`--`));
const unknown = args.filter(
  (arg) => arg.startsWith(`--`) && arg !== `--no-build` && arg !== `--no-tests`
);
if (unknown.length > 0) {
  console.error(`Unknown option ${unknown.join(`, `)}.\n\n${HELP}`);
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), `..`);
const stages = [
  ...(args.includes(`--no-build`)
    ? []
    : [{ name: `build`, command: `vp run --filter "./packages/**" build` }]),
  { name: `format`, command: `vp fmt --check` },
  { name: `lint and types`, command: `vp check --no-fmt` },
  ...(args.includes(`--no-tests`)
    ? []
    : [
        {
          name: `tests`,
          command: [
            `vp test run`,
            ...filters.map((filter) => JSON.stringify(filter))
          ].join(` `)
        }
      ])
];

const results = [];
for (const { name, command } of stages) {
  console.log(`\n━━ ${name}: ${command}`);
  const started = Date.now();
  // `shell` so Windows finds `vp`. Output goes straight through.
  const { status } = spawnSync(command, {
    cwd: root,
    shell: true,
    stdio: `inherit`
  });
  results.push({
    name,
    passed: status === 0,
    seconds: Math.round((Date.now() - started) / 1000)
  });
}

console.log(`\n━━ summary`);
for (const { name, passed, seconds } of results) {
  console.log(`${passed ? `PASS` : `FAIL`}  ${name} (${seconds}s)`);
}
const skipped = [`--no-build`, `--no-tests`].filter((flag) =>
  args.includes(flag)
);
if (skipped.length > 0) console.log(`SKIPPED by ${skipped.join(`, `)}`);
process.exit(results.every(({ passed }) => passed) ? 0 : 1);
