// hast/svg cross-type bridging in buildSpriteContainer cannot be expressed through Element's strict types.
/* oxlint-disable typescript/no-unsafe-type-assertion */
import { unified, type Processor } from "unified";
import rehypeParse from "rehype-parse";
import type { Root, Element } from "hast";
import type { Parent } from "unist";
import { VFile } from "vfile";
import type { SvgCache } from "./cache.js";
import {
  type GroupedImageNodes,
  type SvgNode,
  isSvgNode
} from "./image-node.js";
import { hash } from "./hash.js";
import type { Options } from "./options.js";

const parseSVG = (
  filePath: string,
  svgCache: SvgCache,
  processor: Processor<Root>
): SvgNode => {
  const file = new VFile({ value: svgCache.get(filePath), path: filePath });
  const rootNode = processor.parse(file) as Parent;

  for (const child of rootNode.children) {
    if (isSvgNode(child)) {
      return child;
    }
  }

  throw new Error(
    `Error parsing SVG image: ${filePath}\nUnable to find the root <svg> element.`
  );
};

const isElement = (node: unknown, tagName: string): node is Element => {
  if (typeof node !== "object" || node === null) return false;
  const n = node as { type?: unknown; tagName?: unknown };
  return n.type === "element" && n.tagName === tagName;
};

const getInjectionParent = (tree: Root): Parent => {
  for (const child of tree.children) {
    if (isElement(child, "html")) {
      for (const htmlChild of child.children) {
        if (isElement(htmlChild, "body")) {
          return htmlChild;
        }
      }
    }
  }
  return tree;
};

const buildSpriteContainer = (
  symbols: Array<{ id: string; svgNode: SvgNode }>
): Element => ({
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
        properties: { id, viewBox: svgNode.properties?.viewBox as string },
        children: (svgNode.children ?? []) as Element["children"]
      }))
    }
  ]
});

// The <img>'s attributes carried onto the <svg>. `alt` is not an SVG
// attribute: its text becomes the accessible name (aria-label), as in
// mdit-inline-svg, and an empty alt adds nothing.
const imgAttributes = (
  img: Record<string, unknown>
): Record<string, unknown> => {
  const { src: _src, alt, ...rest } = img;
  return typeof alt === "string" && alt ? { ...rest, ariaLabel: alt } : rest;
};

export const imgToSVG = (
  groupedNodes: GroupedImageNodes,
  svgCache: SvgCache,
  tree: Root,
  options: Options
): void => {
  const processor = unified().use(rehypeParse, {
    fragment: true,
    space: `svg`
  });
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
        const wrapperProps = {
          ...svgProps,
          ...imgAttributes(imgNode.properties)
        };

        Object.assign(imgNode, {
          type: `element`,
          tagName: `svg`,
          properties: wrapperProps,
          children: [
            {
              type: `element`,
              tagName: `use`,
              properties: { href: `#${spriteId}` },
              children: []
            }
          ]
        });
      }
    } else {
      for (const imgNode of imgNodes) {
        const properties = {
          ...svgNode.properties,
          ...imgAttributes(imgNode.properties)
        };
        Object.assign(imgNode, svgNode, { properties });
      }
    }
  }

  if (spriteSymbols.length > 0) {
    const injectionParent = getInjectionParent(tree);
    injectionParent.children.unshift(buildSpriteContainer(spriteSymbols));
  }
};
