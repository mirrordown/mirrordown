import { join } from "node:path";
import type { Transformer } from "unified";
import type { Node, Parent } from "unist";
import type { Root } from "hast";
import type { VFile } from "vfile";
import { SvgCache } from "./cache.js";
import {
  type GroupedImageNodes,
  type ImageNode,
  isImageNode
} from "./image-node.js";
import { imgToSVG } from "./img-to-svg.js";
import { applyDefaults, type Options } from "./options.js";

const isExternalUrl = (src: string): boolean => /^(?:[a-z]+:|\/\/)/i.test(src);

// The file an image's `src` names, by the rule the markdown-it and Sätteri plugins share: decoded as a URL component and joined onto the document's directory, so a leading `/` stays under it. `null` when it names no local file: an external URL (also once decoded), or a malformed percent-escape, which makes `decodeURIComponent` throw.
const resolveSvgPath = (src: string, docDir: string): string | null => {
  if (isExternalUrl(src)) return null;
  try {
    const decoded = decodeURIComponent(src);
    return isExternalUrl(decoded) ? null : join(docDir, decoded);
  } catch {
    return null;
  }
};

const findSvgNodes = (node: Node | Parent): ImageNode[] => {
  let imgNodes: ImageNode[] = [];

  if (isImageNode(node) && node.properties.src.endsWith(`.svg`)) {
    imgNodes.push(node);
  }

  if (`children` in node) {
    for (const child of node.children) {
      imgNodes.push(...findSvgNodes(child));
    }
  }

  return imgNodes;
};

const groupSvgNodes = (
  imgNodes: ImageNode[],
  htmlFile: VFile
): GroupedImageNodes => {
  const groupedNodes: GroupedImageNodes = new Map();

  for (const imgNode of imgNodes) {
    const imagePath = resolveSvgPath(imgNode.properties.src, htmlFile.dirname!);
    if (imagePath === null) continue;
    const group = groupedNodes.get(imagePath);
    if (!group) {
      groupedNodes.set(imagePath, [imgNode]);
    } else {
      group.push(imgNode);
    }
  }

  return groupedNodes;
};

/** rehype plugin that inlines referenced `.svg` images as `<svg>` elements. */
export const rehypeInlineSvg = (
  config?: Partial<Options>
): Transformer<Root, Root> => {
  const options = applyDefaults(config);
  const svgCache = new SvgCache();
  let hits = 0,
    misses = 0;

  return async (tree: Root, file: VFile): Promise<Root> => {
    // Without the document's path there is nothing to resolve images against, so they are left as they are, as in the markdown-it and Sätteri plugins.
    if (!file.path) return tree;

    const imgNodes = findSvgNodes(tree);
    const groupedNodes = groupSvgNodes(imgNodes, file);
    const contents = await Promise.all(
      [...groupedNodes].map(async ([path, nodes]) =>
        svgCache.read(path, nodes.length, options.optimize)
      )
    );
    imgToSVG(groupedNodes, contents, options, file.dirname!);

    if (svgCache.hits !== hits || svgCache.misses !== misses) {
      hits = svgCache.hits;
      misses = svgCache.misses;
      options.cacheEfficiency({ hits, misses });
    }

    return tree;
  };
};
