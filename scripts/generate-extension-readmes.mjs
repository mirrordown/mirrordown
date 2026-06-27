#!/usr/bin/env node
/* oxlint-disable no-continue, curly */
// Generates README.md for each VSCode extension by transforming the matching
// docs/public/guide/plugins/<slug>.md guide into a preview-focused listing.
//
// Unlike the npm package READMEs, extension READMEs:
//   - lead with the Marketplace displayName + description
//   - keep Overview + Syntax (what you type / what the preview renders)
//   - DROP the programmatic "## Usage" and "## Configuration" sections — those
//     show remark/markdown-it plugin wiring, which is irrelevant in a preview
//     extension (the extension just contributes the plugin to VSCode's preview)
//   - add a Styling note for extensions whose plugin ships CSS

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

// extension dir -> guide slug (denden-furigana wraps the `ruby` plugin)
const EXTENSIONS = [
  ["markdown-abbr", "abbr"],
  ["markdown-attrs", "attrs"],
  ["markdown-definition-list", "definition-list"],
  ["markdown-del", "del"],
  ["markdown-denden-furigana", "ruby"],
  ["markdown-github-alerts", "github-alerts"],
  ["markdown-ins", "ins"],
  ["markdown-kbd", "kbd"],
  ["markdown-mark", "mark"],
  ["markdown-steps", "steps"],
  ["markdown-sub", "sub"],
  ["markdown-sup", "sup"],
  ["markdown-tabs", "tabs"],
  ["markdown-unwrap-images", "unwrap-images"]
  // markdown-inline-svg has no guide and is authored by hand
];

const stripFrontmatter = (md) => md.replace(/^---\n[\s\S]*?\n---\n/, "");
const stripStyleBlock = (md) => md.replace(/<style>[\s\S]*?<\/style>\n*/, "");

// Walk the guide into blocks, treating "%"/"%%" tab markers as section breaks.
const parseBlocks = (md) => {
  const blocks = [];
  let current = { kind: "prelude", bodyLines: [] };
  const flush = () => blocks.push(current);
  for (const line of md.split("\n")) {
    if (line.startsWith("%% ")) {
      flush();
      current = { kind: "subtab", label: line.slice(3).trim(), bodyLines: [] };
    } else if (line.startsWith("% ")) {
      flush();
      current = { kind: "tab", label: line.slice(2).trim(), bodyLines: [] };
    } else {
      let stripped = line;
      if (line.startsWith("> ")) stripped = line.slice(2);
      else if (line === ">") stripped = "";
      current.bodyLines.push(stripped);
    }
  }
  flush();
  return blocks;
};

const isDemoCode = (label) => /^(demo|code)$/i.test(label);

// Drop the programmatic part of a guide before parsing: everything from the
// first "## Usage" / "## Configuration" heading onward (which also removes the
// family tabs). These headings are top-level and never blockquote-wrapped.
const dropProgrammatic = (md) =>
  `${md.replace(/\n## (?:Usage|Configuration)\b[\s\S]*$/, "\n")}\n`;

// Render Overview + Syntax: emit prelude prose and the Code half of each
// Demo/Code pair. After dropProgrammatic there are no family tabs left.
const renderPreview = (blocks) => {
  const out = [];
  let pendingCode = null;

  const flushCode = () => {
    if (pendingCode) {
      out.push(pendingCode.join("\n").trimEnd(), "");
      pendingCode = null;
    }
  };

  for (const block of blocks) {
    if (block.kind === "prelude") {
      flushCode();
      const text = block.bodyLines.join("\n").trim();
      if (text) out.push(text, "");
      continue;
    }
    if (block.kind === "tab") {
      flushCode();
      if (isDemoCode(block.label) && /^code$/i.test(block.label)) {
        pendingCode = block.bodyLines;
      }
      continue;
    }
    // subtabs belong to family tabs — drop
  }
  flushCode();
  return out
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

// displayNames/descriptions contain literal HTML element names (<mark>, <kbd>…);
// escape them so they render as text and don't open stray HTML elements.
const esc = (s) => s.replace(/</g, "&lt;").replace(/>/g, "&gt;");

const STYLING_NOTE = `## Styling

This extension ships default styles for the rendered output in the preview. To
customize them, point VSCode's \`markdown.styles\` setting at your own CSS file:

\`\`\`jsonc
// .vscode/settings.json
{
  "markdown.styles": ["./my-preview-styles.css"]
}
\`\`\`
`;

const buildReadme = ({
  displayName,
  description,
  body,
  hasCss,
  pluginPkg
}) => `# ${esc(displayName)}

${esc(description).replace(/\.?$/, ".")}

${body}

${hasCss ? `${STYLING_NOTE}\n` : ""}## About

Part of **[Markdown Preview Extended Syntax](https://marketplace.visualstudio.com/items?itemName=saeris.markdown-preview-extended-syntax)** — a pack of Markdown preview syntax extensions you can install all at once.

Powered by [\`${pluginPkg}\`](https://www.npmjs.com/package/${pluginPkg}) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
`;

let written = 0;
for (const [ext, slug] of EXTENSIONS) {
  const guidePath = join(repoRoot, "docs/public/guide/plugins", `${slug}.md`);
  const pkgPath = join(repoRoot, "extensions", ext, "package.json");
  if (!existsSync(guidePath) || !existsSync(pkgPath)) {
    console.warn(`SKIP ${ext} (missing guide or package.json)`);
    continue;
  }
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const pluginPkg = Object.keys(pkg.devDependencies ?? {}).find((k) =>
    k.startsWith("@mirrordown/mdit-")
  );
  const hasCss = pluginPkg
    ? existsSync(
        join(
          repoRoot,
          "packages",
          pluginPkg.replace("@mirrordown/", ""),
          "package.json"
        )
      ) &&
      Boolean(
        JSON.parse(
          readFileSync(
            join(
              repoRoot,
              "packages",
              pluginPkg.replace("@mirrordown/", ""),
              "package.json"
            ),
            "utf8"
          )
        ).style
      )
    : false;

  const guideMd = stripStyleBlock(
    stripFrontmatter(readFileSync(guidePath, "utf8"))
  );
  const body = renderPreview(parseBlocks(dropProgrammatic(guideMd)));
  const readme = buildReadme({
    displayName: pkg.displayName ?? ext,
    description: pkg.description ?? "",
    body,
    hasCss,
    pluginPkg
  });
  writeFileSync(join(repoRoot, "extensions", ext, "README.md"), readme, "utf8");
  written += 1;
  console.log(`Wrote: extensions/${ext}/README.md`);
}
console.log(`\nTotal: ${written} written`);
