// Inlining referenced `.svg` images, shared by the markdown-it, rehype and Sätteri plugins: whether an SVG's occurrences are inlined, and the markup each becomes. Reading files, optimizing them and resolving paths stay in the plugins, so this module does no I/O.

/** The limits and mode that decide how an SVG's occurrences are inlined. */
export interface InlineSvgLimits {
  /** Skip inlining SVGs larger than this many characters. */
  maxImageSize: number;
  /** Skip inlining an SVG referenced more than this many times. */
  maxOccurrences: number;
  /** Skip inlining an SVG whose occurrences add up to more than this many characters. */
  maxTotalSize: number;
  /** Reuse a repeated SVG through a hidden `<symbol>` and `<use>`. */
  deduplication: boolean;
}

const hash = (str: string): string => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619) >>> 0;
  }
  return h.toString(36);
};

/**
 * The id of a deduplicated SVG's sprite: a hash of its path relative to the document, with `/` separators, so the same document renders the same ids on any machine or OS (an absolute path would leak the build machine into the HTML).
 */
export const svgSpriteId = (relativePath: string): string =>
  `svg-sprite-${hash(relativePath)}`;

// The root's open tag: its attributes, then the `/` of a self-closing root (SVGO writes one when nothing is left inside). Quoted values are skipped whole, so a `>` inside one doesn't end the tag.
const SVG_OPEN_TAG = /<svg((?:[^>"']|"[^"]*"|'[^']*')*?)(\s*\/)?>/i;

const ROOT_ATTRIBUTE = /([^\s=/]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

// What a deduplicated SVG's root splits into: the `viewBox` for the symbol, the size for each reference, and every other attribute, as written, for each reference too. Outline icons carry `fill="none"`, `stroke` and `class` on the root, and those inherit through `<use>`, so a reference without them would draw a different icon. Namespaces stay on the sprite and an `id` can't repeat. Attributes are matched whole, in either quote, so `stroke-width` isn't read as `width`.
const extractSvgParts = (
  content: string
): {
  viewBox: string;
  width: string;
  height: string;
  rest: string[];
  inner: string;
} => {
  const open = SVG_OPEN_TAG.exec(content);
  const parts = { viewBox: ``, width: ``, height: ``, rest: [] as string[] };
  for (const [source, name, double, single] of (open?.[1] ?? ``).matchAll(
    ROOT_ATTRIBUTE
  )) {
    const value = double ?? single ?? ``;
    const key = name.toLowerCase();
    if (key === `viewbox`) parts.viewBox = value;
    else if (key === `width`) parts.width = value;
    else if (key === `height`) parts.height = value;
    else if (key !== `id` && !key.startsWith(`xmlns`)) parts.rest.push(source);
  }
  // A self-closing root has nothing inside.
  const close = content.lastIndexOf(`</svg`);
  const inner =
    open && !open[2] && close >= 0
      ? content.slice(open.index + open[0].length, close).trim()
      : ``;
  return { ...parts, inner };
};

const escAttr = (s: string): string =>
  s.replace(/&/g, `&amp;`).replace(/"/g, `&quot;`);

// The image's alt text is the SVG's accessible name.
const buildFullInline = (content: string, alt: string): string => {
  if (!alt) return content;
  // A function, because a replacement string would read `$1` or `$&` in the alt text as a pattern. The label goes before a self-closing root's `/`, which would otherwise no longer close the tag.
  return content.replace(
    SVG_OPEN_TAG,
    (_, attrs: string, slash: string = ``) =>
      `<svg${attrs} aria-label="${escAttr(alt)}"${slash}>`
  );
};

const buildSpriteHtml = (id: string, viewBox: string, inner: string): string =>
  `<svg aria-hidden="true" style="display:none" xmlns="http://www.w3.org/2000/svg">` +
  `<defs><symbol id="${id}"${viewBox && ` viewBox="${escAttr(viewBox)}"`}>${inner}</symbol></defs>` +
  `</svg>`;

const buildUseHtml = (
  id: string,
  viewBox: string,
  width: string,
  height: string,
  rest: readonly string[],
  alt: string
): string => {
  const attrs = [
    viewBox && `viewBox="${escAttr(viewBox)}"`,
    width && `width="${escAttr(width)}"`,
    height && `height="${escAttr(height)}"`,
    ...rest,
    alt && `aria-label="${escAttr(alt)}"`
  ]
    .filter(Boolean)
    .join(` `);
  return `<svg ${attrs}><use href="#${id}"></use></svg>`;
};

/**
 * The markup for every occurrence of one SVG file, given each occurrence's alt text in document order: the SVG itself, or, with deduplication and more than one occurrence, a hidden sprite on the first and a `<use>` of it on each. `null` when the limits leave the images as they are. `relativePath` is the file's path relative to the document, with `/` separators, for the sprite id.
 */
export const inlineSvgMarkup = (
  content: string,
  alts: readonly string[],
  relativePath: string,
  limits: InlineSvgLimits
): string[] | null => {
  if (content.length > limits.maxImageSize) return null;
  if (alts.length > limits.maxOccurrences) return null;
  if (alts.length * content.length > limits.maxTotalSize) return null;
  if (!limits.deduplication || alts.length < 2) {
    return alts.map((alt) => buildFullInline(content, alt));
  }
  const { viewBox, width, height, rest, inner } = extractSvgParts(content);
  const id = svgSpriteId(relativePath);
  const sprite = buildSpriteHtml(id, viewBox, inner);
  return alts.map((alt, index) => {
    const use = buildUseHtml(id, viewBox, width, height, rest, alt);
    return index === 0 ? sprite + use : use;
  });
};
