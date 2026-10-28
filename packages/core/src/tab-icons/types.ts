/**
 * An icon: SVG markup, or a light and dark pair that the color scheme picks between. Pairs render both SVGs, and the stylesheet shows one; icons that adapt to the color scheme themselves (with `light-dark()`) can be single SVGs.
 */
export type TabIcon = string | { light: string; dark: string };

/** Options shared by the tab-icons plugins for every engine. */
export interface TabIconsOptions {
  /**
   * Your own icons, by keyword (a whole word of a label, such as `deno`) or file name and extension (a key with a `.`, such as `.astro` or `deno.json`). They're checked before the built-in ones, and replace one with the same key.
   */
  icons?: Record<string, TabIcon> | undefined;
  /**
   * Include the icons Mirrordown ships (the set vitepress-plugin-group-icons matches).
   *
   * @default true
   */
  builtin?: boolean | undefined;
  /**
   * Match a label's text to an icon when it has no `[!keyword]` marker.
   *
   * @default true
   */
  match?: boolean | undefined;
  /**
   * The tabs plugin's `containerClass`, when you changed it.
   *
   * @default "markdown-tabs"
   */
  containerClass?: string | undefined;
}
