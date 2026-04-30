import { unified, type Processor } from "unified";
import rehypeParse from "rehype-parse";
import type { Root } from "hast";
import type { Parent } from "unist";
import { VFile } from "vfile";
import type { SvgCache } from "./cache.js";
import { type GroupedImageNodes, type SvgNode, isSvgNode } from "./image-node.js";

const parseSVG = (filePath: string, svgCache: SvgCache, processor: Processor<Root>): SvgNode => {
  const file = new VFile({ value: svgCache.get(filePath), path: filePath });
  const rootNode = processor.parse(file) as Parent;

  for (const child of rootNode.children) {
    if (isSvgNode(child)) {
      return child;
    }
  }

  throw new Error(`Error parsing SVG image: ${filePath}\nUnable to find the root <svg> element.`);
};

export const imgToSVG = (groupedNodes: GroupedImageNodes, svgCache: SvgCache): void => {
  const processor = unified().use(rehypeParse, { fragment: true, space: `svg` });

  for (const [filePath, imgNodes] of groupedNodes) {
    const svgNode = parseSVG(filePath, svgCache, processor);

    for (const imgNode of imgNodes) {
      const properties = { ...svgNode.properties, ...imgNode.properties };
      // @ts-expect-error — src is an img attribute, not valid on svg
      delete properties.src;
      Object.assign(imgNode, svgNode, { properties });
    }
  }
};
