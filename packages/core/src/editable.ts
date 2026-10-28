// A mutable copy of a read-only tree, for engines whose nodes can't be rewritten in place (Sätteri), so they can run the same recognition as remark.
// A node's children are its own node type; `TreeNode` can't say so, so the two reads of them are asserted.
/* oxlint-disable typescript/no-unsafe-type-assertion */

/** The part of a node the copy reads: its children, if it has any. */
export interface TreeNode {
  type: string;
  children?: readonly TreeNode[];
  data?: unknown;
}

/** A copy of a tree, and how to write the changes made to it back. */
export interface EditableTree<N extends TreeNode> {
  /** A plain, mutable copy of the tree, for recognition to rewrite. */
  tree: N;
  /**
   * Write a node of the (rewritten) copy back: a node recognition left alone becomes the engine's own node again, so it keeps what the engine tracks for it (such as its source position, which later plugins read), and `setChildren` is called only where a children list changed, `setData` only where its `data` was replaced. `build` converts a node recognition created, writing back any copied nodes inside it.
   */
  writeBack: (node: N) => N;
}

export const editableTree = <N extends TreeNode>(
  root: N,
  build: (node: N, writeBack: (node: N) => N) => N,
  setChildren: (node: N, children: N[]) => void,
  setData?: (node: N, data: unknown) => void
): EditableTree<N> => {
  const originals = new Map<N, { node: N; children: readonly N[] }>();

  const copy = (node: N): N => {
    const children = node.children as readonly N[] | undefined;
    if (!children) {
      const leaf = { ...node };
      originals.set(leaf, { node, children: [] });
      return leaf;
    }
    const branch = { ...node, children: children.map(copy) };
    originals.set(branch, { node, children });
    return branch;
  };

  const writeBack = (node: N): N => {
    const original = originals.get(node);
    if (!original) return build(node, writeBack);
    if (setData && node.data !== original.node.data)
      setData(original.node, node.data);
    if (!node.children) return original.node;
    const children = (node.children as readonly N[]).map(writeBack);
    const changed =
      children.length !== original.children.length ||
      children.some((child, index) => child !== original.children[index]);
    if (changed) setChildren(original.node, children);
    return original.node;
  };

  return { tree: copy(root), writeBack };
};
