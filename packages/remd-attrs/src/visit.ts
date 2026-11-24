import type { Node, Parent } from "unist";
import { CONTINUE, EXIT, SKIP } from "unist-util-visit";

const isParent = (node: Node): node is Parent =>
  Boolean((node as Partial<Parent>).children);

type Visitor<N extends Node> = (
  node: N,
  index: number | undefined,
  parent: Parent | undefined
) => unknown;

/**
 * `unist-util-visit`'s `visit`, in the two forms this plugin calls it: on every node, or on every node of one type, a parent before its children, with the node's index and parent, and the same answers from the visitor (`SKIP`, `EXIT`, or `[SKIP, index]` to go on from another child). That one works out each node's index with `indexOf` on its parent's children, which costs the number of its siblings for every node it visits: a document of 20,000 paragraphs, or a list of 20,000 items, was walked in quadratic time, once for each rule. Here the index is where the walk is.
 */
export function visit<N extends Node>(
  tree: Node,
  type: string,
  visitor: Visitor<N>
): void;
export function visit(tree: Node, visitor: Visitor<Node>): void;
export function visit(
  tree: Node,
  typeOrVisitor: string | Visitor<Node>,
  maybeVisitor?: Visitor<Node>
): void {
  const type = typeof typeOrVisitor === "string" ? typeOrVisitor : undefined;
  const visitor =
    typeof typeOrVisitor === "string" ? maybeVisitor! : typeOrVisitor;

  const walk = (
    node: Node,
    index: number | undefined,
    parent: Parent | undefined
  ): unknown[] => {
    let result: unknown[] = [];
    if (type === undefined || node.type === type) {
      const value = visitor(node, index, parent);
      result = Array.isArray(value)
        ? value
        : typeof value === "number"
          ? [CONTINUE, value]
          : value === null || value === undefined
            ? []
            : [value];
      if (result[0] === EXIT) return result;
    }
    if (isParent(node) && result[0] !== SKIP) {
      let offset = 0;
      // The children are read again at each step, as a visitor may have spliced them.
      while (offset < node.children.length) {
        const answer = walk(node.children[offset], offset, node);
        if (answer[0] === EXIT) return answer;
        offset = typeof answer[1] === "number" ? answer[1] : offset + 1;
      }
    }
    return result;
  };
  walk(tree, undefined, undefined);
}
