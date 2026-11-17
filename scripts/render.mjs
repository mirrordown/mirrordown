#!/usr/bin/env node
// Renders a Markdown snippet through the three presets (markdown-it, remark, Sätteri) and prints each engine's HTML, with a diff where they disagree. Run `node scripts/render.mjs --help`.
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HELP = `Render Markdown through the three Mirrordown presets and compare the engines.

Usage:
  node scripts/render.mjs [options] "<markdown>"
  node scripts/render.mjs [options] --file <path>
  <command> | node scripts/render.mjs [options]

Input:
  "<markdown>"        The snippet. \\n in it is a line break (use --literal to keep it as written).
  --file <path>       Read the snippet from a file, byte for byte.
  (stdin)             Used when there is no snippet and no --file.

Which plugins:
  --only a,b          Only these preset features (their option keys: mark, kbd, githubAlerts, …).
  --off a,b           Every feature but these. Also takes gfm.
  --plain             Shorthand for turning off the document-level transforms: slug, autolinkHeadings,
                      sectionize, copyCode, squeezeParagraphs, unwrapImages, lightbox, mermaidPele.
  --options '<json>'  Preset options, merged last: '{"githubAlerts":{"icons":false}}'.
  --features          List the feature keys and exit.

Output:
  --pretty            One tag per line.
  --json              The raw result as JSON: { mdit, remd, sat, agree, options }.

Exit code: 0 when the three engines agree, 1 when they differ, 2 on a usage or run error.
The HTML is normalised as the tests normalise it (character-reference spelling, line breaks between block tags).`;

const PLAIN = [
  `slug`,
  `autolinkHeadings`,
  `sectionize`,
  `copyCode`,
  `squeezeParagraphs`,
  `unwrapImages`,
  `lightbox`,
  `mermaidPele`
];

const fail = (message) => {
  console.error(message);
  process.exit(2);
};

const args = process.argv.slice(2);
const flags = { off: [] };
const positional = [];
const list = (value) =>
  value
    .split(`,`)
    .map((key) => key.trim())
    .filter(Boolean);
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  const value = () => args[++i] ?? fail(`${arg} needs a value`);
  if (arg === `--help` || arg === `-h`) {
    console.log(HELP);
    process.exit(0);
  } else if (arg === `--file`) flags.file = value();
  else if (arg === `--only`) flags.only = list(value());
  else if (arg === `--off`) flags.off.push(...list(value()));
  else if (arg === `--plain`) flags.off.push(...PLAIN);
  else if (arg === `--options`) {
    try {
      flags.options = JSON.parse(value());
    } catch (error) {
      fail(`--options is not JSON: ${error.message}`);
    }
  } else if (arg === `--pretty`) flags.pretty = true;
  else if (arg === `--json`) flags.json = true;
  else if (arg === `--literal`) flags.literal = true;
  else if (arg === `--features`) flags.features = true;
  else if (arg.startsWith(`--`)) fail(`Unknown option ${arg}. Try --help.`);
  else positional.push(arg);
}

const readInput = () => {
  if (flags.features) {
    return ``;
  }
  if (typeof flags.file === `string`) {
    return readFileSync(flags.file, `utf8`);
  }
  if (positional.length > 0) {
    const written = positional.join(` `);
    return flags.literal ? written : written.replaceAll(`\\n`, () => `\n`);
  }
  if (process.stdin.isTTY) {
    return fail(`No Markdown given. Try --help.`);
  }
  return readFileSync(0, `utf8`);
};
const input = readInput();

const root = join(dirname(fileURLToPath(import.meta.url)), `..`);
const work = mkdtempSync(join(tmpdir(), `mirrordown-render-`));
const requestPath = join(work, `request.json`);
const outputPath = join(work, `result.json`);
let result;
try {
  writeFileSync(
    requestPath,
    JSON.stringify({
      input,
      only: flags.only,
      off: flags.off,
      options: flags.options,
      output: outputPath
    })
  );
  // `shell` so Windows finds `vp`; the arguments hold no user text.
  const run = spawnSync(`vp test run --root scripts/render`, {
    cwd: root,
    shell: true,
    encoding: `utf8`,
    env: { ...process.env, MIRRORDOWN_RENDER: requestPath }
  });
  try {
    result = JSON.parse(readFileSync(outputPath, `utf8`));
  } catch {
    fail(`The render run produced no result.\n${run.stdout}\n${run.stderr}`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (flags.features) {
  console.log(result.features.join(`\n`));
  process.exit(0);
}
if (result.unknown.length > 0) {
  fail(
    `Unknown feature ${result.unknown.join(`, `)}. Known: ${result.features.join(`, `)}.`
  );
}

const engines = [`mdit`, `remd`, `sat`];
const agree = engines.every((engine) => result[engine] === result.mdit);
if (flags.json) {
  console.log(JSON.stringify({ ...result, agree }, null, 2));
  process.exit(agree ? 0 : 1);
}

// One tag per line, so a diff points at the element that differs.
const lines = (html) => html.replaceAll(/>\s*</g, () => `>\n<`).split(`\n`);
const show = (html) => (flags.pretty ? lines(html).join(`\n`) : html);

// A line diff by longest common subsequence: the outputs are a few hundred lines at most.
const diff = (before, after) => {
  const a = lines(before);
  const b = lines(after);
  const table = Array.from({ length: a.length + 1 }, () =>
    Array.from({ length: b.length + 1 }, () => 0)
  );
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] =
        a[i] === b[j]
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const out = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      i++;
      j++;
    } else if (
      j < b.length &&
      (i === a.length || table[i][j + 1] > table[i + 1][j])
    ) {
      out.push(`+ ${b[j++]}`);
    } else {
      out.push(`- ${a[i++]}`);
    }
  }
  return out.join(`\n`);
};

// Engines that printed the same HTML share a heading.
const groups = new Map();
for (const engine of engines) {
  groups.set(result[engine], [...(groups.get(result[engine]) ?? []), engine]);
}
for (const [html, names] of groups) {
  console.log(`── ${names.join(` = `)}\n${show(html)}\n`);
}
if (!agree) {
  const [[first, firstNames], ...rest] = groups;
  for (const [html, names] of rest) {
    console.log(
      `── diff: - ${firstNames.join(`, `)}  + ${names.join(`, `)}\n${diff(first, html)}\n`
    );
  }
  console.log(`The engines differ.`);
}
process.exit(agree ? 0 : 1);
