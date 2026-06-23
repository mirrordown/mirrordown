#!/usr/bin/env node
// Generator script — flow control uses `continue` for clarity over the
// repeated branches; the no-continue / curly rules don't apply here.
/* oxlint-disable no-continue, curly */
// Generates README.md for each remd-* and mdit-* package by transforming
// the corresponding docs/public/guide/plugins/<slug>.md guide.
//
// The guide uses the @saeris/remd-tabs syntax:
//   % Tab Label       — top-level tab
//   %% Subtab Label   — nested tab inside the preceding top-level tab
//   > <body content>  — blockquote body for the current tab
//
// We transform that into plain markdown by:
//   1. Stripping frontmatter and the <style> import
//   2. Unwrapping every blockquote-wrapped line (drop leading "> ") so
//      code fences render correctly
//   3. Converting "% Foo" / "%% Foo" into "### Foo" headings (or skipping
//      the wrapping entirely for the Demo/Code dual-render pattern,
//      which only makes sense in the docs site)
//   4. Splitting the Usage section by family so each package's README
//      only shows installation/integration for that family

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

const slugs = [
  "abbr",
  "attrs",
  "definition-list",
  "del",
  "github-alerts",
  "ins",
  "kbd",
  "mark",
  "ruby",
  "steps",
  "sub",
  "sup",
  "tabs",
  "unwrap-images"
];

const stripFrontmatter = (md) => md.replace(/^---\n[\s\S]*?\n---\n/, "");
const stripStyleBlock = (md) => md.replace(/<style>[\s\S]*?<\/style>\n*/, "");

// Walks the doc one line at a time, treating "%"/"%%" markers as section
// breaks. Returns an ordered list of blocks:
//   { kind: "prelude" | "tab" | "subtab", label?: string, bodyLines: string[] }
// Body lines are returned with the leading "> " (blockquote wrapper) stripped.
const parseBlocks = (md) => {
  const lines = md.split("\n");
  const blocks = [];
  let current = { kind: "prelude", bodyLines: [] };

  const flush = () => {
    blocks.push(current);
  };

  for (const line of lines) {
    if (line.startsWith("%% ")) {
      flush();
      current = { kind: "subtab", label: line.slice(3).trim(), bodyLines: [] };
    } else if (line.startsWith("% ")) {
      flush();
      current = { kind: "tab", label: line.slice(2).trim(), bodyLines: [] };
    } else {
      // Strip blockquote wrapper. `>` alone is a blank quoted line; `> foo`
      // is the wrapped content.
      let stripped = line;
      if (line.startsWith("> ")) stripped = line.slice(2);
      else if (line === ">") stripped = "";
      current.bodyLines.push(stripped);
    }
  }
  flush();
  return blocks;
};

// "Demo/Code" tab pairs in the Syntax section render the same content
// twice — once as a live demo, once as the raw markdown source. For the
// README we want only the Code variant (the raw source), since READMEs
// don't have the demo renderer. Detect Demo/Code pairs at the top level
// and keep only Code.
const isDemoCodeLabel = (label) => /^(demo|code)$/i.test(label);

// Render blocks back into flat markdown. Top-level family tabs
// ("Remark" / "Markdown-It") are filtered to the requested family
// (and their label becomes the H2). Demo/Code pairs collapse to Code only.
// Other subtabs ("Astro", "VitePress", "Unified", "Standalone") become H3.
const renderForFamily = (blocks, wantedFamily) => {
  // wantedFamily: "remark" or "markdown-it"
  const out = [];
  let activeFamilyMatches = null; // null = outside family section
  let pendingDemoCode = null; // { codeBody?: string[] }

  const flushPendingDemoCode = () => {
    if (pendingDemoCode && pendingDemoCode.codeBody) {
      out.push(pendingDemoCode.codeBody.join("\n").trimEnd());
      out.push("");
    }
    pendingDemoCode = null;
  };

  for (const block of blocks) {
    if (block.kind === "prelude") {
      flushPendingDemoCode();
      // Strip a trailing "## Usage" heading — we replace it with "## Install"
      // when emitting the family-specific install section below.
      const text = block.bodyLines
        .join("\n")
        .replace(/\n*## Usage\s*$/, "")
        .trimEnd();
      if (text) {
        out.push(text);
        out.push("");
      }
      activeFamilyMatches = null;
      continue;
    }

    if (block.kind === "tab") {
      flushPendingDemoCode();
      const label = block.label;
      if (isDemoCodeLabel(label)) {
        if (/^code$/i.test(label)) {
          pendingDemoCode = { codeBody: block.bodyLines };
        }
        // Demo discarded
        activeFamilyMatches = null;
        continue;
      }
      // Family tab
      const labelLower = label.toLowerCase();
      const family = labelLower.startsWith("remark")
        ? "remark"
        : labelLower.startsWith("markdown-it")
          ? "markdown-it"
          : null;
      activeFamilyMatches = family === wantedFamily;
      if (activeFamilyMatches) {
        out.push("## Install");
        out.push("");
        out.push(block.bodyLines.join("\n").trim());
        out.push("");
      }
      continue;
    }

    if (block.kind === "subtab") {
      if (activeFamilyMatches === false || activeFamilyMatches === null)
        continue;
      out.push(`### ${block.label}`);
      out.push("");
      out.push(block.bodyLines.join("\n").trim());
      out.push("");
    }
  }
  flushPendingDemoCode();
  return `${out
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()}\n`;
};

const buildReadme = (slug, family, guideMd) => {
  const stripped = stripStyleBlock(stripFrontmatter(guideMd));
  const blocks = parseBlocks(stripped);
  const wantedFamily = family === "remd" ? "remark" : "markdown-it";
  const body = renderForFamily(blocks, wantedFamily);

  const isRemd = family === "remd";
  const pkgName = isRemd ? `@saeris/remd-${slug}` : `@saeris/mdit-${slug}`;
  const familyLabel = isRemd ? "remark/rehype (unified)" : "markdown-it";

  return `# ${pkgName}

> Part of [\`@saeris/markdown\`](https://github.com/saeris/markdown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A ${familyLabel} plugin for the \`${slug}\` syntax extension.

${body}
## Documentation

Full documentation, more examples, and configuration options: [saeris.github.io/markdown/guide/plugins/${slug}](https://saeris.github.io/markdown/guide/plugins/${slug})

## License

MIT © [Drake Costa](https://saeris.gg)
`;
};

let written = 0;
let skipped = 0;
for (const slug of slugs) {
  const guidePath = join(
    repoRoot,
    "docs",
    "public",
    "guide",
    "plugins",
    `${slug}.md`
  );
  if (!existsSync(guidePath)) {
    console.warn(`SKIP (no guide): ${slug}`);
    skipped++;
    continue;
  }
  const guideMd = readFileSync(guidePath, "utf8");

  for (const family of ["remd", "mdit"]) {
    const pkgDir = join(repoRoot, "packages", `${family}-${slug}`);
    if (!existsSync(pkgDir)) {
      console.warn(`SKIP (no package): ${family}-${slug}`);
      skipped++;
      continue;
    }
    const readmePath = join(pkgDir, "README.md");
    const readme = buildReadme(slug, family, guideMd);
    writeFileSync(readmePath, readme, "utf8");
    written++;
    console.log(`Wrote: packages/${family}-${slug}/README.md`);
  }
}

console.log(`\nTotal: ${written} written, ${skipped} skipped`);
