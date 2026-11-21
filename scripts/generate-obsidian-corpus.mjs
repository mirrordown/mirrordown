#!/usr/bin/env node
// Writes tests/obsidian/fixtures/corpus.json from the recordings of real Obsidian that quartz-community/remark-obsidian keeps (MIT): for each of its cases, the Markdown and what Obsidian's Reading view made of it, reduced to the facts the test in tests/obsidian compares. The recordings themselves are 5.7 MB of HTML; these facts are a tenth of that.
//
//   node scripts/generate-obsidian-corpus.mjs <path to remark-obsidian>/test/parity/goldens/obsidian.json <commit>
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const [input, commit] = process.argv.slice(2);
if (!input || !commit) {
  console.error(
    `Usage: node scripts/generate-obsidian-corpus.mjs <goldens/obsidian.json> <remark-obsidian commit>`
  );
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), `..`);
const recorded = JSON.parse(readFileSync(input, `utf8`));

// A callout in Obsidian's HTML, by its fold marker: "" (not foldable), "+" or "-".
const callouts = (html) =>
  [...html.matchAll(/<div\b[^>]*\bdata-callout-fold="([^"]*)"[^>]*>/g)].map(
    ([, fold]) => fold
  );

const cases = Object.values(recorded.cases).map(
  ({ id, markdown, obsidian }) => ({
    id,
    markdown,
    // The tags the Reading view rendered as links, without their `#`.
    tags: obsidian.projections.tags,
    // The text of each highlight.
    highlights: obsidian.projections.highlights,
    // Each task box's character, and whether it rendered checked.
    tasks: obsidian.projections.tasks,
    callouts: callouts(obsidian.html)
  })
);

writeFileSync(
  join(root, `tests`, `obsidian`, `fixtures`, `corpus.json`),
  `${JSON.stringify(
    {
      source: `https://github.com/quartz-community/remark-obsidian`,
      file: `test/parity/goldens/obsidian.json`,
      commit,
      license: `MIT, see LICENSE-remark-obsidian beside this file`,
      obsidian: recorded.obsidian.app,
      recordedAt: recorded.recordedAt,
      cases
    },
    null,
    1
  )}\n`
);
console.log(
  `${cases.length} cases recorded in Obsidian ${recorded.obsidian.app}`
);
