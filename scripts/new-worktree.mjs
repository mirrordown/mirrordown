#!/usr/bin/env node
// Creates a git worktree that is safe to run tests in: its own install and its own build. Yarn's node-modules linker makes `node_modules/@mirrordown/core` a link to one checkout's `packages/core`, so a worktree that shares another checkout's `node_modules` silently tests that checkout's core.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HELP = `Create a worktree with its own install and build.

Usage:
  node scripts/new-worktree.mjs <name> <branch> [--from <ref>] [--dir <folder>]

  <name>      Folder name of the worktree, such as w1.
  <branch>    Branch to create there. An existing branch is checked out as it is.
  --from      What a new branch starts from. Default: main.
  --dir       Where worktrees live. Default: ../mirrordown-wt, beside this checkout.

Never run \`git stash\` in any worktree: the stash is shared by all of them.
Remove one with \`git worktree remove <path>\`, then delete what is left of its node_modules.`;

const args = process.argv.slice(2);
if (args.length === 0 || args.includes(`--help`) || args.includes(`-h`)) {
  console.log(HELP);
  process.exit(args.length === 0 ? 1 : 0);
}
const option = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index === -1 ? fallback : args[index + 1];
};
const [name, branch] = args.filter(
  (arg, i) => !arg.startsWith(`--`) && !args[i - 1]?.startsWith(`--`)
);
if (!name || !branch) {
  console.error(HELP);
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), `..`);
const path = join(resolve(root, option(`--dir`, `../mirrordown-wt`)), name);
if (existsSync(path)) {
  console.error(
    `${path} already exists. Reuse it with \`git switch\` and a rebuild, or remove it first.`
  );
  process.exit(1);
}

const run = (title, command, commandArgs, options = {}) => {
  console.log(`\n━━ ${title}`);
  const { status } = spawnSync(command, commandArgs, {
    stdio: `inherit`,
    ...options
  });
  if (status !== 0) {
    console.error(`\nFailed: ${title}. The worktree at ${path} is incomplete.`);
    process.exit(1);
  }
};

const exists =
  spawnSync(
    `git`,
    [`rev-parse`, `--verify`, `--quiet`, `refs/heads/${branch}`],
    { cwd: root }
  ).status === 0;
run(
  `worktree ${path} on ${branch}`,
  `git`,
  exists
    ? [`worktree`, `add`, path, branch]
    : [`worktree`, `add`, path, `-b`, branch, option(`--from`, `main`)],
  { cwd: root }
);
// The main checkout's cache saves downloading every package again. `shell` so Windows finds `vp`.
const env = { ...process.env, YARN_CACHE_FOLDER: join(root, `.yarn`, `cache`) };
run(`install`, `vp install`, [], { cwd: path, shell: true, env });
run(`build`, `vp run --filter "./packages/**" build`, [], {
  cwd: path,
  shell: true,
  env
});
console.log(`\nReady: ${path} on ${branch}`);
