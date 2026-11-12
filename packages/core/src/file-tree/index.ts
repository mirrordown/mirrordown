// File trees, shared by the markdown-it, rehype and Sätteri plugins: reading a ` ```filetree ` fence, which file gets which icon, and the markup the tree renders as. A fence holds one name per line, nested by indentation or by the branches the `tree` command draws, so it reads as a tree where the plugins aren't installed too.

import type { HastLike } from "../hast.js";
import {
  SETI_EXTENSIONS,
  SETI_ICONS,
  SETI_NAMES,
  SETI_PARTIALS,
  type FileTreeColor,
  type FileTreeIconEntry
} from "./icons.js";

export type { FileTreeColor };

/** The fence language a file tree is written in. */
export const FILE_TREE_LANGUAGE = "filetree";

/** The class the tree's root `<ul>` takes; its parts take it with a suffix. */
export const FILE_TREE_CLASS = "markdown-file-tree";

const LANGUAGE_CLASS = `language-${FILE_TREE_LANGUAGE}`;

/** A row's git status. */
export type FileTreeStatus =
  | `added`
  | `modified`
  | `deleted`
  | `renamed`
  | `untracked`
  | `ignored`;

// The letters a row's `[X]` marks its git status with, as `git status` prints them.
const STATUSES = new Map<string, FileTreeStatus>([
  [`A`, `added`],
  [`M`, `modified`],
  [`D`, `deleted`],
  [`R`, `renamed`],
  [`U`, `untracked`],
  [`I`, `ignored`]
]);
const LETTERS = new Map([...STATUSES].map(([letter, name]) => [name, letter]));

/** A row of a file tree. */
export interface FileTreeEntry {
  /** Its name, without the `/` or `/…` that marked it a folder. */
  name: string;
  /** A file, a folder, or a placeholder (`...`) for entries left out. */
  kind: `file` | `folder` | `more`;
  /** A folder written `name/…`, which starts closed. */
  collapsed: boolean;
  /** Written `**name**`. */
  highlight: boolean;
  status: FileTreeStatus | undefined;
  comment: string | undefined;
  children: FileTreeEntry[];
}

/** A Shiki or VS Code color theme, as far as a file tree reads it. */
export interface FileTreeTheme {
  type?: string;
  colors?: Record<string, string | undefined>;
  tokenColors?: readonly FileTreeThemeRule[];
  /** Shiki's older name for `tokenColors`. */
  settings?: readonly FileTreeThemeRule[];
}

/** One of a theme's token color rules. */
export interface FileTreeThemeRule {
  scope?: string | readonly string[];
  settings?: { foreground?: string };
}

/** Options shared by the file-tree plugins for every engine. */
export interface FileTreeOptions {
  /**
   * A Shiki or VS Code theme to color the trees with, or a light and a dark one, as Shiki's `themes` takes them (the pair follows the page's `color-scheme`). Without one, the stylesheet's own colors apply.
   */
  theme?: FileTreeTheme | { light: FileTreeTheme; dark: FileTreeTheme };
  /** Icons, as SVG markup, used before the built-in Seti icons. */
  icons?: FileTreeIconOptions;
}

/** Icons to use before the built-in Seti icons, as SVG markup. */
export interface FileTreeIconOptions {
  /** Every folder's icon. */
  folder?: string;
  /** The icon of a file nothing else matches. */
  file?: string;
  /** Icons by exact file name, such as `package.json`. */
  names?: Record<string, string>;
  /** Icons by extension, without its leading dot, such as `ts` or `d.ts`. */
  extensions?: Record<string, string>;
}

// A row's branches: the `tree` command's (├── └── │, or |-- `-- | with --charset=ascii), a list item's marker, or indentation.
const PREFIX = /^(?:[├└┣┗╰`+|][─━-]+ ?|[│┃|]|[-*+] |\s)*/u;
// The line `tree` ends with.
const SUMMARY = /^\d+ (?:director(?:y|ies)|files?)(?:, \d+ files?)?$/;
// A comment: `#` or `//` after a space, followed by a space or nothing. Both patterns look at one space before their marker, not at the run of them: a `\s+` is tried again from every space of a long run, which takes the square of its length.
const COMMENT = /(?<=\s)(?:#|\/\/)(?=\s|$)/;
const STATUS = /\s\[([AMDRUI])\]$/;
const HIGHLIGHT = /^\*\*(.+)\*\*$/;
const PLACEHOLDER = /^(?:\.{3}|…)$/;
const COLLAPSED = /\/(?:\.{3}|…)$/;

// Tabs, as columns: each moves to the next multiple of 4.
const expandTabs = (line: string): string => {
  const [first = ``, ...rest] = line.split(`\t`);
  let out = first;
  for (const text of rest) out += ` `.repeat(4 - (out.length % 4)) + text;
  return out;
};

// A row as it's read: the column its name starts at, and whether it ended in `/`, settle where it goes and what it is.
interface Row extends Omit<FileTreeEntry, `children`> {
  column: number;
  slash: boolean;
  children: Row[];
}

const parseRow = (line: string): Row | undefined => {
  const prefix = PREFIX.exec(line)?.[0] ?? ``;
  let rest = line.slice(prefix.length).trimEnd();
  if (rest === ``) return undefined;
  let comment: string | undefined;
  const commentAt = COMMENT.exec(rest);
  if (commentAt) {
    comment = rest
      .slice(commentAt.index + commentAt[0].length)
      .replace(/^(?:#|\/\/)/, ``)
      .trim();
    rest = rest.slice(0, commentAt.index).trimEnd();
    if (comment === ``) comment = undefined;
  }
  let status: FileTreeStatus | undefined;
  const statusAt = STATUS.exec(rest);
  if (statusAt) {
    status = STATUSES.get(statusAt[1] ?? ``);
    rest = rest.slice(0, statusAt.index).trimEnd();
  }
  const highlighted = HIGHLIGHT.exec(rest);
  let name = (highlighted?.[1] ?? rest).trim();
  if (PLACEHOLDER.test(name))
    return {
      name: `…`,
      kind: `more`,
      collapsed: false,
      highlight: false,
      status: undefined,
      comment,
      children: [],
      column: prefix.length,
      slash: false
    };
  const collapsed = COLLAPSED.test(name);
  if (collapsed) name = name.replace(COLLAPSED, ``);
  const slash = collapsed || (name.length > 1 && name.endsWith(`/`));
  if (slash && !collapsed) name = name.slice(0, -1);
  return {
    name,
    kind: `file`,
    collapsed,
    highlight: highlighted !== null,
    status,
    comment,
    children: [],
    column: prefix.length,
    slash
  };
};

const toEntry = ({ column: _, slash, ...row }: Row): FileTreeEntry => ({
  ...row,
  kind:
    row.kind === `more`
      ? `more`
      : slash || row.children.length > 0
        ? `folder`
        : `file`,
  children: row.children.map(toEntry)
});

/**
 * A file tree's rows, nested: each row goes under the nearest row above it whose name starts further left, so any indentation works, as do the branches `tree` draws. A leading `.` row, as `tree` starts with, and the count `tree` ends with are left out. Blank lines are skipped.
 */
export const parseFileTree = (source: string): FileTreeEntry[] => {
  const lines = source
    .replace(/\r\n?/g, `\n`)
    .split(`\n`)
    .map(expandTabs)
    .filter((line) => line.trim() !== ``);
  if (SUMMARY.test(lines.at(-1)?.trim() ?? ``)) lines.pop();
  const roots: Row[] = [];
  const open: Row[] = [];
  for (const line of lines) {
    const row = parseRow(line);
    if (!row) continue;
    while (open.length > 0 && (open.at(-1)?.column ?? 0) >= row.column)
      open.pop();
    (open.at(-1)?.children ?? roots).push(row);
    // A placeholder holds nothing: rows below it go under the row above it.
    if (row.kind !== `more`) open.push(row);
  }
  const [first] = roots;
  const top =
    roots.length === 1 && first && (first.name === `.` || first.name === `./`)
      ? first.children
      : roots;
  return top.map(toEntry);
};

const escapeText = (value: string): string =>
  value.replace(/&/g, `&amp;`).replace(/</g, `&lt;`).replace(/>/g, `&gt;`);

const escapeAttribute = (value: string): string =>
  value.replace(/&/g, `&amp;`).replace(/"/g, `&quot;`);

/** A row's icon: SVG markup, and the Seti color it takes, if any. */
export interface FileTreeIcon {
  svg: string;
  color: FileTreeColor | undefined;
}

/** The icon a file or folder named `name` gets. */
export const fileTreeIcon = (
  name: string,
  folder: boolean,
  icons: FileTreeIconOptions = {}
): FileTreeIcon => {
  const fallback = SETI_ICONS[`default`] ?? ``;
  if (folder)
    return {
      svg: icons.folder ?? SETI_ICONS[`folder`] ?? fallback,
      color: undefined
    };
  const seti = ([icon, color]: FileTreeIconEntry): FileTreeIcon => ({
    svg: SETI_ICONS[icon] ?? fallback,
    color
  });
  // A row may be a path, such as `components/Button.tsx`: its last part names it.
  const base = name.slice(name.lastIndexOf(`/`) + 1);
  // The tables are plain objects, and a file can be named after what every object inherits (`constructor`, `toString`): only a table's own keys are icons.
  const own = <T>(
    table: Record<string, T> | undefined,
    key: string
  ): T | undefined =>
    table && Object.hasOwn(table, key) ? table[key] : undefined;
  const custom = own(icons.names, base);
  if (custom) return { svg: custom, color: undefined };
  const named = own(SETI_NAMES, base);
  if (named) return seti(named);
  // Everything after the first dot, then after each later one: `d.ts`, then `ts`.
  for (let at = base.indexOf(`.`); at !== -1; at = base.indexOf(`.`, at + 1)) {
    const extension = base.slice(at + 1).toLowerCase();
    const customExtension = own(icons.extensions, extension);
    if (customExtension) return { svg: customExtension, color: undefined };
    const byExtension = own(SETI_EXTENSIONS, extension);
    if (byExtension) return seti(byExtension);
  }
  for (const [part, entry] of Object.entries(SETI_PARTIALS))
    if (base.includes(part)) return seti(entry);
  return icons.file
    ? { svg: icons.file, color: undefined }
    : seti([`default`, `white`]);
};

// Theme colors, as the tree's custom properties take them: the editor's, so a tree matches the code blocks around it, and the explorer's for rows and git decorations.
const THEME_COLORS: ReadonlyArray<[property: string, keys: readonly string[]]> =
  [
    [`background`, [`editor.background`]],
    [`foreground`, [`editor.foreground`]],
    [`hover`, [`list.hoverBackground`]],
    [
      `highlight`,
      [`list.activeSelectionBackground`, `editor.selectionBackground`]
    ],
    [`highlight-foreground`, [`list.activeSelectionForeground`]],
    [
      `guide`,
      [
        `tree.indentGuidesStroke`,
        `editorIndentGuide.background1`,
        `editorIndentGuide.background`
      ]
    ],
    [`focus`, [`list.focusOutline`, `focusBorder`]],
    [`added`, [`gitDecoration.addedResourceForeground`]],
    [`modified`, [`gitDecoration.modifiedResourceForeground`]],
    [`deleted`, [`gitDecoration.deletedResourceForeground`]],
    [`renamed`, [`gitDecoration.renamedResourceForeground`]],
    [`untracked`, [`gitDecoration.untrackedResourceForeground`]],
    [`ignored`, [`gitDecoration.ignoredResourceForeground`]]
  ];

// A value that could be a CSS color, in any notation (VS Code's themes use hex; oklch() and the rest are welcome): only the characters colors are written with, and balanced parentheses, so it can't end the declaration it's written into or swallow the ones after it. The stylesheet ignores one that turns out not to be a color.
const isColor = (value: string | undefined): value is string => {
  if (value === undefined || !/^[\w\s#%.,/()+-]+$/.test(value)) return false;
  let depth = 0;
  for (const character of value) {
    if (character === `(`) depth += 1;
    else if (character === `)`) depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0;
};

// The color a theme gives comments.
const commentColor = (theme: FileTreeTheme): string | undefined => {
  for (const rule of theme.tokenColors ?? theme.settings ?? []) {
    const scopes =
      typeof rule.scope === `string`
        ? rule.scope.split(`,`).map((scope) => scope.trim())
        : (rule.scope ?? []);
    if (scopes.includes(`comment`) && isColor(rule.settings?.foreground))
      return rule.settings.foreground;
  }
  return undefined;
};

const themeColors = (theme: FileTreeTheme): Map<string, string> => {
  const colors = new Map<string, string>();
  for (const [property, keys] of THEME_COLORS) {
    const value = keys.map((key) => theme.colors?.[key]).find(isColor);
    if (value) colors.set(property, value);
  }
  const comment = commentColor(theme);
  if (comment) colors.set(`comment`, comment);
  return colors;
};

/**
 * The custom properties a theme sets on a tree, as a `style` attribute's value: `--markdown-file-tree-theme-<name>` for each color the theme has, and a single theme's `color-scheme`. A light and dark pair sets `light-dark()` values, for the colors both themes have, and follows the page's scheme.
 */
export const fileTreeThemeStyle = (
  theme: NonNullable<FileTreeOptions["theme"]>
): string => {
  const entries: Array<[string, string]> = [];
  // One theme's tree is light or dark whatever the page is, so the stylesheet's own colors (Seti's, the git colors) take that scheme too.
  let scheme = ``;
  if (`light` in theme && `dark` in theme) {
    const light = themeColors(theme.light);
    const dark = themeColors(theme.dark);
    for (const [property, value] of light) {
      const other = dark.get(property);
      if (other) entries.push([property, `light-dark(${value}, ${other})`]);
    }
  } else {
    entries.push(...themeColors(theme));
    if (theme.type === `light` || theme.type === `dark`)
      scheme = `color-scheme:${theme.type};`;
  }
  return (
    scheme +
    entries
      .map(
        ([property, value]) => `--${FILE_TREE_CLASS}-theme-${property}:${value}`
      )
      .join(`;`)
  );
};

const renderRow = (
  entry: FileTreeEntry,
  icons: FileTreeIconOptions
): string => {
  if (entry.kind === `more`)
    return `<span class="${FILE_TREE_CLASS}-name">…</span>`;
  const { svg, color } = fileTreeIcon(
    entry.name,
    entry.kind === `folder`,
    icons
  );
  const colored = color ? ` data-color="${color}"` : ``;
  const status = entry.status
    ? `<span class="${FILE_TREE_CLASS}-status">${LETTERS.get(entry.status) ?? ``}</span>`
    : ``;
  const comment = entry.comment
    ? `<span class="${FILE_TREE_CLASS}-comment">${escapeText(entry.comment)}</span>`
    : ``;
  return `<span class="${FILE_TREE_CLASS}-icon"${colored} aria-hidden="true">${svg}</span><span class="${FILE_TREE_CLASS}-name">${escapeText(entry.name)}</span>${comment}${status}`;
};

const MORE: FileTreeEntry = {
  name: `…`,
  kind: `more`,
  collapsed: false,
  highlight: false,
  status: undefined,
  comment: undefined,
  children: []
};

const renderEntries = (
  entries: readonly FileTreeEntry[],
  depth: number,
  icons: FileTreeIconOptions
): string =>
  entries
    .map((entry) => {
      const attributes = `${entry.status ? ` data-status="${entry.status}"` : ``}${entry.highlight ? ` data-highlight` : ``}`;
      const open = `<li class="${FILE_TREE_CLASS}-${entry.kind}" data-depth="${depth}"${attributes}>`;
      const row = renderRow(entry, icons);
      // A folder with nothing in it has nothing to open; one written `name/…` holds a placeholder.
      const children =
        entry.children.length > 0
          ? entry.children
          : entry.collapsed
            ? [MORE]
            : [];
      if (entry.kind !== `folder` || children.length === 0)
        return `${open}<span class="${FILE_TREE_CLASS}-row">${row}</span></li>`;
      return `${open}<details${entry.collapsed ? `` : ` open`}><summary class="${FILE_TREE_CLASS}-row">${row}</summary><ul>${renderEntries(children, depth + 1, icons)}</ul></details></li>`;
    })
    .join(``);

/** An HTML attribute, as markdown-it's tokens hold them. */
export type FileTreeAttribute = [name: string, value: string];

/**
 * Builds the trees of a document under the plugin's options: a fence's source and the attributes its block had (from `{#id .class}`) become a `<ul class="markdown-file-tree">` of nested rows, each folder a `<details>` whose `<summary>` is its row, open unless it was written `name/…`. Returns `undefined` for a fence with no rows, which stays a code block. The attributes' classes are added after the tree's, and a style after the theme's.
 */
export const createFileTree = (
  options: FileTreeOptions = {}
): ((
  source: string,
  attributes?: readonly FileTreeAttribute[]
) => string | undefined) => {
  const icons = options.icons ?? {};
  const themeStyle = options.theme ? fileTreeThemeStyle(options.theme) : ``;
  return (source, attributes = []) => {
    const entries = parseFileTree(source);
    if (entries.length === 0) return undefined;
    const merged = new Map<string, string>([[`class`, FILE_TREE_CLASS]]);
    if (themeStyle) merged.set(`style`, escapeAttribute(themeStyle));
    for (const [name, value] of attributes) {
      const current = merged.get(name);
      if (name === `class`) {
        const added = value
          .split(/\s+/)
          .filter((item) => item !== `` && item !== LANGUAGE_CLASS)
          .map(escapeAttribute)
          .join(` `);
        if (added) merged.set(name, `${current} ${added}`);
      } else if (name === `style` && current) {
        merged.set(name, `${current};${escapeAttribute(value)}`);
      } else {
        merged.set(name, escapeAttribute(value));
      }
    }
    const tag = [...merged]
      .map(([name, value]) => ` ${name}="${value}"`)
      .join(``);
    return `<ul${tag}>${renderEntries(entries, 1, icons)}</ul>`;
  };
};

const textOf = (node: HastLike): string =>
  node.type === `text`
    ? (node.value ?? ``)
    : (node.children ?? []).map(textOf).join(``);

const hasLanguage = (node: HastLike): boolean => {
  const value = node.properties?.className;
  return Array.isArray(value)
    ? value.includes(LANGUAGE_CLASS)
    : typeof value === `string` && value.split(/\s+/).includes(LANGUAGE_CLASS);
};

/**
 * The tree a hast `<pre>` holds: a `<pre>` whose only content (besides whitespace) is a `<code class="language-filetree">`, as a ` ```filetree ` fence renders. `element` is the `<code>`, whose attributes the tree takes. `undefined` for anything else.
 */
export const fileTreeBlock = (
  pre: HastLike
): { source: string; element: HastLike } | undefined => {
  if (pre.type !== `element` || pre.tagName !== `pre`) return undefined;
  let code: HastLike | undefined;
  for (const child of pre.children ?? []) {
    if (child.type === `text` && /^\s*$/.test(child.value ?? ``)) continue;
    if (code || child.tagName !== `code`) return undefined;
    code = child;
  }
  return code && hasLanguage(code)
    ? { source: textOf(code), element: code }
    : undefined;
};
