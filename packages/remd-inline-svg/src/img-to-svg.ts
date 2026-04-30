import { unified, type Processor } from "unified";
import rehypeParse from "rehype-parse";
import type { Root } from "hast";
import type { Node, Parent } from "unist";
import { VFile } from "vfile";
import type { SvgCache } from "./cache.js";
import { type GroupedImageNodes, type SvgNode, isSvgNode } from "./image-node.js";
import { hash } from "./hash.js";
import type { Options } from "./options.js";

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

const getInjectionParent = (tree: Root): Parent => {
  for (const child of tree.children) {
    const node = child as unknown as Record<string, unknown>;
    if (node.type === `element` && node.tagName === `html`) {
      for (const htmlChild of (node.children as Record<string, unknown>[]) ?? []) {
        if (htmlChild.type === `element` && htmlChild.tagName === `body`) {
          return htmlChild as unknown as Parent;
        }
      }
    }
  }
  return tree as unknown as Parent;
};

const buildSpriteContainer = (
  symbols: Array<{ id: string; svgNode: SvgNode }>,
): Record<string, unknown> => ({
  type: `element`,
  tagName: `svg`,
  properties: { ariaHidden: `true`, style: `display:none` },
  children: [
    {
      type: `element`,
      tagName: `defs`,
      properties: {},
      children: symbols.map(({ id, svgNode }) => ({
        type: `element`,
        tagName: `symbol`,
        properties: { id, viewBox: svgNode.properties?.viewBox },
        children: svgNode.children ?? [],
      })),
    },
  ],
});

export const imgToSVG = (
  groupedNodes: GroupedImageNodes,
  svgCache: SvgCache,
  tree: Root,
  options: Options,
): void => {
  const processor = unified().use(rehypeParse, { fragment: true, space: `svg` });
  const spriteSymbols: Array<{ id: string; svgNode: SvgNode }> = [];

  for (const [filePath, imgNodes] of groupedNodes) {
    const svgNode = parseSVG(filePath, svgCache, processor);
    const useDedup = options.deduplication && imgNodes.length > 1;

    if (useDedup) {
      const spriteId = `svg-sprite-${hash(filePath)}`;
      spriteSymbols.push({ id: spriteId, svgNode });

      for (const imgNode of imgNodes) {
        const svgProps = { ...svgNode.properties };
        delete svgProps.id;
        const imgProps = {
          ...((imgNode as unknown as Record<string, unknown>).properties as Record<
            string,
            unknown
          >),
        };
        delete imgProps.src;
        const wrapperProps = { ...svgProps, ...imgProps };

        Object.assign(imgNode as unknown as Record<string, unknown>, {
          type: `element`,
          tagName: `svg`,
          properties: wrapperProps,
          children: [
            {
              type: `element`,
              tagName: `use`,
              properties: { href: `#${spriteId}` },
              children: [],
            },
          ],
        });
      }
    } else {
      for (const imgNode of imgNodes) {
        const properties = {
          ...svgNode.properties,
          ...(imgNode as unknown as { properties: Record<string, unknown> }).properties,
        };
        delete properties.src;
        Object.assign(imgNode as unknown as Node, svgNode as unknown as Node, { properties });
      }
    }
  }

  if (spriteSymbols.length > 0) {
    const injectionParent = getInjectionParent(tree);
    injectionParent.children.unshift(buildSpriteContainer(spriteSymbols) as unknown as Node);
  }
};
