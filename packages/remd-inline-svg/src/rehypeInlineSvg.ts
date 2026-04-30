import { resolve } from "node:path";
import type { Transformer } from "unified";
import type { Node, Parent } from "unist";
import type { Root } from "hast";
import type { VFile } from "vfile";
import { SvgCache } from "./cache.js";
import { type GroupedImageNodes, type ImageNode, isImageNode } from "./image-node.js";
import { imgToSVG } from "./img-to-svg.js";
import { applyDefaults, type Options } from "./options.js";

const isExternalUrl = (src: string): boolean => /^(?:[a-z]+:|\/\/)/i.test(src);

const findSvgNodes = (node: Node | Parent): ImageNode[] => {
  let imgNodes: ImageNode[] = [];

  if (
    isImageNode(node) &&
    node.properties.src.endsWith(`.svg`) &&
    !isExternalUrl(node.properties.src)
  ) {
    imgNodes.push(node);
  }

  if (`children` in node) {
    for (const child of (node as Parent).children) {
      imgNodes.push(...findSvgNodes(child));
    }
  }

  return imgNodes;
};

const groupSvgNodes = (imgNodes: ImageNode[], htmlFile: VFile): GroupedImageNodes => {
  const groupedNodes: GroupedImageNodes = new Map();

  for (const imgNode of imgNodes) {
    const imagePath = resolve(htmlFile.dirname!, decodeURI(imgNode.properties.src));
    const group = groupedNodes.get(imagePath);
    if (!group) {
      groupedNodes.set(imagePath, [imgNode]);
    } else {
      group.push(imgNode);
    }
  }

  return groupedNodes;
};

const filterSvgNodes = (
  groupedNodes: GroupedImageNodes,
  svgCache: SvgCache,
  options: Options,
): GroupedImageNodes => {
  const filteredNodes: GroupedImageNodes = new Map();

  for (const [filePath, imgNodes] of groupedNodes) {
    if (imgNodes.length > options.maxOccurrences) continue;

    const fileSize = svgCache.get(filePath)!.length;
    if (fileSize > options.maxImageSize) continue;

    const totalSize = imgNodes.length * fileSize;
    if (totalSize > options.maxTotalSize) continue;

    filteredNodes.set(filePath, imgNodes);
  }

  return filteredNodes;
};

export const rehypeInlineSvg = (config?: Partial<Options>): Transformer<Root, Root> => {
  const options = applyDefaults(config);
  const svgCache = new SvgCache();
  let hits = 0,
    misses = 0;

  return async (tree: Root, file: VFile): Promise<Root> => {
    if (!file.path) {
      throw new Error(`Cannot inline SVG images because the path of the HTML file is unknown`);
    }

    const imgNodes = findSvgNodes(tree);
    let groupedNodes = groupSvgNodes(imgNodes, file);
    await svgCache.read(groupedNodes, options.optimize);
    groupedNodes = filterSvgNodes(groupedNodes, svgCache, options);
    imgToSVG(groupedNodes, svgCache, tree, options);

    if (svgCache.hits !== hits || svgCache.misses !== misses) {
      hits = svgCache.hits;
      misses = svgCache.misses;
      options.cacheEfficiency({ hits, misses });
    }

    return tree;
  };
};
