// Tab icons, shared by the markdown-it, rehype and Sätteri plugins: which icon a tab label gets, and the markup it renders as. A label names its icon with a marker (`[!npm] Install`), or, without one, its text is matched to an icon, as vitepress-plugin-group-icons matches its code-group labels (MIT, © 2024-present Leo): a keyword as a whole word of the label, else a file name or extension it ends with.
import { mermaidSvg } from "../mermaid-pele.js";
import { BUILTIN_TAB_ICONS } from "./builtin.js";
import type { TabIcon, TabIconsOptions } from "./types.js";

export { BUILTIN_TAB_ICONS };
export type { TabIcon, TabIconsOptions };

/** The class each icon's `<svg>` takes. */
export const TAB_ICON_CLASS = "markdown-tab-icon";

// A marker at the start of a label: `[!keyword]`, then spaces.
const MARKER = /^\[!([^\]\s]+)\][ \t]*/;

// The marker that turns matching off for one label.
const NONE = `none`;

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`);

// A keyword matches a whole word, optionally followed by a `js`, `rc` or `ignore` suffix or digits: `vite` matches `vite.config.ts`, `Vite 8` and `VitePress`, but not `invite.ts`.
const keywordPattern = (keyword: string): RegExp =>
  new RegExp(
    `(?<![a-z])${escapeRegExp(keyword)}(?:js|rc|ignore)?(?![a-z])`,
    `i`
  );

// An extension that isn't at the end of the label: `.env` matches `.env.local`, but `.c` doesn't match `test.c456789`.
const extensionPattern = (extension: string): RegExp =>
  new RegExp(
    `${/^[a-z0-9]/i.test(extension) ? `(?<![a-z0-9])` : ``}${escapeRegExp(extension)}(?![a-z0-9])`,
    `i`
  );

/** What a tab label becomes: its icon, if it has one, and its text without its marker. */
export interface TabLabelIcon {
  icon: TabIcon | undefined;
  /** The marker at the start of the label's text (`[!npm] `), to remove from it, or `""`. */
  marker: string;
  /** The label's text without its marker: the marker's keyword when nothing else is left. */
  label: string;
}

/**
 * A resolver for tab labels' icons under a plugin's options. Given a label's plain text, it returns the icon for its `[!keyword]` marker (an unknown keyword isn't a marker; `[!none]` gives no icon), or, without one, the icon its text matches: the longest keyword that is a whole word of the label (case-insensitive, also after splitting camelCase), else the longest file name or extension it ends with, else one in it. Your icons come before the built-in ones.
 */
export const createTabIconResolver = (
  options: TabIconsOptions = {}
): ((label: string) => TabLabelIcon) => {
  const { builtin = true, match = true } = options;
  const custom = options.icons ?? {};
  const icons: Record<string, TabIcon> = {
    ...(builtin ? BUILTIN_TAB_ICONS : {}),
    ...custom
  };
  const byLength = (
    entries: Array<[string, TabIcon]>
  ): Array<[string, TabIcon]> =>
    entries.sort(([a], [b]) => b.length - a.length);
  const keywords = byLength(
    Object.entries(icons).filter(([key]) => !key.includes(`.`))
  ).map(([key, icon]) => [keywordPattern(key), icon] as const);
  const extensions = (
    source: Record<string, TabIcon>
  ): Array<readonly [string, RegExp, TabIcon]> =>
    byLength(Object.entries(source).filter(([key]) => key.includes(`.`))).map(
      ([key, icon]) => [key.toLowerCase(), extensionPattern(key), icon] as const
    );
  // Your extensions first, so a custom `.vitepress` matches `.vitepress/config.ts` before the built-in `.ts` does.
  const extensionGroups = [
    extensions(custom),
    extensions(builtin ? BUILTIN_TAB_ICONS : {})
  ];
  const named = new Map(
    Object.entries(icons).map(([key, icon]) => [key.toLowerCase(), icon])
  );

  const matchText = (label: string): TabIcon | undefined => {
    const words = [label, label.replace(/([a-z0-9])([A-Z])/g, `$1 $2`)];
    const keyword = keywords.find(([pattern]) =>
      words.some((word) => pattern.test(word))
    );
    if (keyword) return keyword[1];
    const lower = label.toLowerCase();
    for (const group of extensionGroups) {
      const found =
        group.find(([extension]) => lower.endsWith(extension)) ??
        group.find(([, pattern]) => pattern.test(label));
      if (found) return found[2];
    }
    return undefined;
  };

  return (label) => {
    const marker = MARKER.exec(label);
    const keyword = marker?.[1]?.toLowerCase();
    if (marker && keyword && (keyword === NONE || named.has(keyword))) {
      const rest = label.slice(marker[0].length);
      return {
        icon: keyword === NONE ? undefined : named.get(keyword),
        marker: marker[0],
        label: rest || (keyword === NONE ? `` : (marker[1] ?? ``))
      };
    }
    return {
      icon: match ? matchText(label) : undefined,
      marker: ``,
      label
    };
  };
};

/**
 * The markup for a tab icon, to go before the label's text: the `<svg>` with the icon class and `aria-hidden` (the label names the tab), or, for a light and dark pair, both, marked `data-scheme="light"` and `"dark"` for the stylesheet to show one.
 */
// A pair renders both variants for now. Icons that adapt with `light-dark()` would need one SVG each, and a single sprite sheet recolored through SVG link parameters (https://pepelsbey.dev/articles/svg-link-params/) would need none per label; the `TabIcon` type leaves room for both.
export const tabIconMarkup = (icon: TabIcon): string => {
  const svg = (markup: string, scheme?: string): string =>
    mermaidSvg(markup.trim(), [
      [`class`, TAB_ICON_CLASS],
      [`aria-hidden`, `true`],
      ...(scheme ? ([[`data-scheme`, scheme]] as Array<[string, string]>) : [])
    ]);
  return typeof icon === `string`
    ? svg(icon)
    : svg(icon.light, `light`) + svg(icon.dark, `dark`);
};
