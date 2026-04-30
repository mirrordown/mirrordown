import type { Node } from "unist";

export interface ImageNode extends Node {
  type: `element`;
  tagName: `img`;
  properties: {
    src: string;
  };
}

export interface SvgNode extends Node {
  type: `element`;
  tagName: `svg`;
  properties?: {
    [key: string]: string;
  };
}

export type GroupedImageNodes = Map<string, ImageNode[]>;

export type ImageNodeGroup = [string, ImageNode[]];

export const isImageNode = (node: unknown): node is ImageNode => {
  const img = node as ImageNode;
  return (
    img.type === `element` &&
    img.tagName === `img` &&
    img.properties &&
    typeof img.properties.src === `string`
  );
};

export const isSvgNode = (node: Node): node is SvgNode => {
  const svg = node as SvgNode;
  return svg.type === `element` && svg.tagName === `svg`;
};
