import { relative, sep } from "node:path";
import { inlineSvgMarkup } from "@mirrordown/core";
import type { GroupedImageNodes, ImageNode } from "./image-node.js";
import type { Options } from "./options.js";

// The SVG is emitted verbatim as a `raw` node rather than parsed into hast, so
// its markup reaches the HTML byte-for-byte (as in mdit-inline-svg) instead of
// being re-serialized. Later rehype plugins therefore see an opaque string, not
// an element tree, and rehype-stringify needs `allowDangerousHtml: true`.

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

// The limits, deduplication and markup are shared with the markdown-it and Sätteri plugins through `@mirrordown/core`.
export const imgToSVG = (
  groupedNodes: GroupedImageNodes,
  contents: ReadonlyArray<string | null>,
  options: Options,
  docDir: string
): void => {
  [...groupedNodes].forEach(([filePath, imgNodes], group) => {
    // A file that couldn't be read or parsed leaves its images as they are.
    const content = contents[group];
    if (content === null) return;
    const markup = inlineSvgMarkup(
      content,
      imgNodes.map(altOf),
      relative(docDir, filePath).split(sep).join(`/`),
      options
    );
    if (!markup) return;
    imgNodes.forEach((img, index) => {
      toRaw(img, markup[index]);
    });
  });
};
