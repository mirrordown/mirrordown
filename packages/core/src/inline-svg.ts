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

const extractSvgParts = (
  content: string
): { viewBox: string; width: string; height: string; inner: string } => {
  const openTag = /<svg([^>]*?)>/i.exec(content)?.[1] ?? ``;
  return {
    viewBox: /viewBox="([^"]*)"/i.exec(openTag)?.[1] ?? ``,
    width: /\bwidth="([^"]*)"/i.exec(openTag)?.[1] ?? ``,
    height: /\bheight="([^"]*)"/i.exec(openTag)?.[1] ?? ``,
    inner: /<svg[^>]*>([\s\S]*?)<\/svg\s*>/i.exec(content)?.[1]?.trim() ?? ``
  };
};

const escAttr = (s: string): string =>
  s.replace(/&/g, `&amp;`).replace(/"/g, `&quot;`);

// The image's alt text is the SVG's accessible name.
const buildFullInline = (content: string, alt: string): string => {
  if (!alt) return content;
  return content.replace(
    /<svg([^>]*)>/i,
    `<svg$1 aria-label="${escAttr(alt)}">`
  );
};

const buildSpriteHtml = (id: string, viewBox: string, inner: string): string =>
  `<svg aria-hidden="true" style="display:none" xmlns="http://www.w3.org/2000/svg">` +
  `<defs><symbol id="${id}" viewBox="${escAttr(viewBox)}">${inner}</symbol></defs>` +
  `</svg>`;

const buildUseHtml = (
  id: string,
  viewBox: string,
  width: string,
  height: string,
  alt: string
): string => {
  const attrs = [
    viewBox && `viewBox="${escAttr(viewBox)}"`,
    width && `width="${escAttr(width)}"`,
    height && `height="${escAttr(height)}"`,
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
  const { viewBox, width, height, inner } = extractSvgParts(content);
  const id = svgSpriteId(relativePath);
  const sprite = buildSpriteHtml(id, viewBox, inner);
  return alts.map((alt, index) => {
    const use = buildUseHtml(id, viewBox, width, height, alt);
    return index === 0 ? sprite + use : use;
  });
};
