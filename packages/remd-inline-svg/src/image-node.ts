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
  properties?: Record<string, unknown>;
  children?: Node[];
}

export type GroupedImageNodes = Map<string, ImageNode[]>;

export type ImageNodeGroup = [string, ImageNode[]];

export const isImageNode = (node: unknown): node is ImageNode => {
  if (typeof node !== "object" || node === null) return false;
  const img = node as {
    type?: string;
    tagName?: string;
    properties?: { src?: unknown };
  };
  return (
    img.type === `element` &&
    img.tagName === `img` &&
    typeof img.properties?.src === `string`
  );
};

export const isSvgNode = (node: Node): node is SvgNode => {
  const svg = node as { type?: string; tagName?: string };
  return svg.type === `element` && svg.tagName === `svg`;
};
