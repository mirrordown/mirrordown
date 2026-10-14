import type { SvgCache } from "./cache.js";
import type { GroupedImageNodes, ImageNode } from "./image-node.js";
import { hash } from "./hash.js";
import type { Options } from "./options.js";

// The SVG is emitted verbatim as a `raw` node rather than parsed into hast, so
// its markup reaches the HTML byte-for-byte (as in mdit-inline-svg) instead of
// being re-serialized. Later rehype plugins therefore see an opaque string, not
// an element tree, and rehype-stringify needs `allowDangerousHtml: true`.

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

const altOf = (img: ImageNode): string =>
  typeof img.properties.alt === `string` ? img.properties.alt : ``;

// Turn the <img> element into a raw node in place, keeping its position.
const toRaw = (img: ImageNode, value: string): void => {
  const node: {
    type: string;
    tagName?: string;
    properties?: unknown;
    children?: unknown;
    value?: string;
  } = img;
  delete node.tagName;
  delete node.properties;
  delete node.children;
  node.type = `raw`;
  node.value = value;
};

export const imgToSVG = (
  groupedNodes: GroupedImageNodes,
  svgCache: SvgCache,
  options: Options
): void => {
  for (const [filePath, imgNodes] of groupedNodes) {
    const content = svgCache.get(filePath)!;

    if (options.deduplication && imgNodes.length > 1) {
      // The first occurrence carries the hidden sprite; every occurrence
      // references it with <use>.
      const { viewBox, width, height, inner } = extractSvgParts(content);
      const id = `svg-sprite-${hash(filePath)}`;
      const sprite = buildSpriteHtml(id, viewBox, inner);
      imgNodes.forEach((img, i) => {
        const use = buildUseHtml(id, viewBox, width, height, altOf(img));
        toRaw(img, i === 0 ? sprite + use : use);
      });
    } else {
      for (const img of imgNodes)
        toRaw(img, buildFullInline(content, altOf(img)));
    }
  }
};
