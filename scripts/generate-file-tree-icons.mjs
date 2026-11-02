#!/usr/bin/env node
// Generates packages/core/src/file-tree/icons.ts: the Seti UI icons file-tree ships, as SVG markup, and Seti's table of which file gets which icon and color, so the plugins need no icon packages at runtime. The icons and table come from Seti UI (MIT, © 2014 Jesse Weed, https://github.com/jesseweed/seti-ui), at the commit below: the paths are read from its icon font, which Seti builds from its SVGs, so each icon is one clean path. Fitting the glyphs to a 24×24 box, and the aliases, overrides and ignores, follow Starlight's file-icons-generator (MIT, © withastro, https://github.com/withastro/starlight). Rerun after moving the commit, then format the output with `vp fmt`:
//
//   node scripts/generate-file-tree-icons.mjs
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

// opentype.js is CommonJS, and Node finds no named exports in it.
const { parse } = createRequire(import.meta.url)("opentype.js");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "packages/core/src/file-tree/icons.ts");

const COMMIT = "2d6c5e68b4ded73c92dac291845ee44e1182d511";
const setiUrl = (path) =>
  `https://raw.githubusercontent.com/jesseweed/seti-ui/${COMMIT}/${path}`;

// Icons whose SVG is identical to another's share one glyph in the font, named after the first.
const aliases = { coffee: `cjsx`, html_erb: `html`, less: `json` };
// Icons drawn with another icon: near-duplicates, and VS Code's Go icon in place of the old one.
const overrides = { ejs: `html`, go: `go2`, npm_ignored: `npm` };
const renames = { cjsx: `coffee`, go2: `go` };
// ReasonML's glyph is a plain square: its SVG has a path the font conversion breaks.
const ignores = new Set([`reasonml`]);

const SIZE = 24;
// Hundredths of a 24-unit box: finer than a pixel at any size the tree shows them.
const PRECISION = 2;

const round = (value) => Number(value.toFixed(PRECISION));

// A number in path data: rounded, without trailing zeros or a zero before the point.
const number = (value) =>
  String(round(value)).replace(/^0\./, `.`).replace(/^-0\./, `-.`);

// Numbers joined as path data needs them: a minus sign, or a point after a number that has one, separates them already.
const numbers = (values) =>
  values.reduce((data, value) => {
    const text = number(value);
    if (data === ``) return text;
    const separate =
      text.startsWith(`-`) || (text.startsWith(`.`) && /\.\d*$/.test(data));
    return `${data}${separate ? `` : ` `}${text}`;
  }, ``);

// opentype's commands (M, L, Q, C, Z in absolute coordinates) as relative path data, which is shorter. Each point is rounded before its offset from the last is taken, so rounding doesn't add up along a path.
const relative = (commands) => {
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let last = ``;
  let data = ``;
  // A command's letter and offsets, or nothing for a line that goes nowhere; a straight line is written as h or v.
  const step = (command) => {
    const points =
      command.type === `C`
        ? [command.x1, command.y1, command.x2, command.y2, command.x, command.y]
        : command.type === `Q`
          ? [command.x1, command.y1, command.x, command.y]
          : [command.x, command.y];
    const offsets = points.map((value, index) =>
      round(round(value) - (index % 2 === 0 ? x : y))
    );
    const letter = command.type.toLowerCase();
    if (letter !== `l`) return { letter, offsets };
    const [dx, dy] = offsets;
    if (dx === 0 && dy === 0) return null;
    if (dy === 0) return { letter: `h`, offsets: [dx] };
    if (dx === 0) return { letter: `v`, offsets: [dy] };
    return { letter, offsets };
  };
  for (const command of commands) {
    if (command.type === `Z`) {
      data += `z`;
      x = startX;
      y = startY;
      last = `z`;
    } else {
      const next = step(command);
      if (next) {
        // A repeated command needs no letter, except a move, whose repeats are lines.
        const args = numbers(next.offsets);
        data +=
          next.letter === last && next.letter !== `m`
            ? args.startsWith(`-`)
              ? args
              : ` ${args}`
            : `${next.letter}${args}`;
        last = next.letter;
      }
      x = round(command.x);
      y = round(command.y);
      if (command.type === `M`) {
        startX = x;
        startY = y;
      }
    }
  }
  return data;
};

const fetchOk = async (path) => {
  const response = await fetch(setiUrl(path));
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response;
};

const mapping = await (
  await fetchOk(`styles/components/icons/mapping.less`)
).text();
const font = parse(
  await (await fetchOk(`styles/_fonts/seti/seti.woff`)).arrayBuffer()
);

// .icon-set(".ts", "typescript", @blue);  .icon-partial("mix", "hex", @red);
const line = /^\.icon-(set|partial)\((['"])(.+)\2, \2(.+)\2, @([\w-]+)\);$/;

const names = {};
const extensions = {};
const partials = {};
const icons = new Set([`folder`, `default`]);
const colors = new Set([`white`]);

const entries = mapping
  .split(/\r?\n/)
  .map((text) => line.exec(text.trim()))
  .filter((match) => match && !ignores.has(match[4]));
for (const [, type, , identifier, lang, color] of entries) {
  const icon = overrides[lang] ?? lang;
  icons.add(icon);
  colors.add(color);
  const entry = [renames[icon] ?? icon, color];
  if (type === `partial`) partials[identifier] = entry;
  else if (identifier.startsWith(`.`)) extensions[identifier.slice(1)] = entry;
  else names[identifier] = entry;
}

const dimensions = (glyph, fontSize) => {
  const box = glyph.getPath(0, 0, fontSize).getBoundingBox();
  return { ...box, width: box.x2 - box.x1, height: box.y2 - box.y1 };
};

// The largest whole font size that fits the glyph in the box, centered.
const fit = (glyph, icon) => {
  if (dimensions(glyph, SIZE).width <= 0) {
    throw new Error(`Seti's glyph for the icon "${icon}" is empty`);
  }
  let fontSize = SIZE;
  for (;;) {
    const { width, height } = dimensions(glyph, fontSize + 1);
    if (width > SIZE || height > SIZE) break;
    fontSize += 1;
  }
  const { x1, y1, width, height } = dimensions(glyph, fontSize);
  return relative(
    glyph.getPath(
      -(x1 + (width - SIZE) / 2),
      -(y1 + (height - SIZE) / 2),
      fontSize
    ).commands
  );
};

const svg = (viewBox, d) =>
  `<svg viewBox="${viewBox}"><path d="${d}"></path></svg>`;

// An icon added after Seti last built its font, read from its SVG, which must be one path, in its own viewBox.
const fromSvg = async (icon) => {
  const markup = await (await fetchOk(`icons/${icon}.svg`)).text();
  const d = [...markup.matchAll(/<path\b[^>]*\sd="([^"]+)"/g)];
  const viewBox = /viewBox="([^"]+)"/.exec(markup)?.[1];
  if (d.length !== 1 || !viewBox || /<(?!\/?(svg|path)\b)/.test(markup)) {
    throw new Error(
      `The icon "${icon}" isn't in Seti's font, and its SVG isn't one path`
    );
  }
  return svg(viewBox, d[0][1]);
};

// A name the font lacks gives its empty `.notdef` glyph.
const named = (name) => {
  const glyph = font.nameToGlyph(name);
  return glyph?.name === name ? glyph : null;
};

const paths = Object.fromEntries(
  await Promise.all(
    [...icons].map(async (icon) => {
      const glyph = named(icon) ?? (aliases[icon] && named(aliases[icon]));
      return [
        renames[icon] ?? icon,
        glyph
          ? svg(`0 0 ${SIZE} ${SIZE}`, fit(glyph, icon))
          : await fromSvg(icon)
      ];
    })
  )
);

const sorted = (record) =>
  Object.fromEntries(
    Object.entries(record).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  );

const json = (value) => JSON.stringify(value, null, 2);

writeFileSync(
  output,
  `// Generated by scripts/generate-file-tree-icons.mjs from Seti UI (MIT, © 2014 Jesse Weed, https://github.com/jesseweed/seti-ui) at ${COMMIT}. Don't edit it by hand: rerun the script.

/** A Seti color, which the stylesheet turns into a \`--markdown-file-tree-<color>\` token. */
export type FileTreeColor = ${[...colors]
    .sort()
    .map((color) => `"${color}"`)
    .join(` | `)};

/** An icon and its color. */
export type FileTreeIconEntry = readonly [icon: string, color: FileTreeColor];

/** Each Seti icon, as SVG markup filled with \`currentColor\` by the stylesheet. */
export const SETI_ICONS: Record<string, string> = ${json(sorted(paths))};

/** Icons by exact file name. */
export const SETI_NAMES: Record<string, FileTreeIconEntry> = ${json(sorted(names))};

/** Icons by extension, without its leading dot. */
export const SETI_EXTENSIONS: Record<string, FileTreeIconEntry> = ${json(sorted(extensions))};

/** Icons by part of a file name. */
export const SETI_PARTIALS: Record<string, FileTreeIconEntry> = ${json(sorted(partials))};
`
);

console.log(
  `${Object.keys(paths).length} icons; ${Object.keys(names).length} names, ${Object.keys(extensions).length} extensions, ${Object.keys(partials).length} partials; colors: ${[...colors].join(`, `)}`
);
