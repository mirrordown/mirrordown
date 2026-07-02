import type { Element, ElementContent, Root, RootContent } from "hast";
import type { Plugin } from "unified";

const HEADING_RANK: Record<string, number> = {
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
  h5: 5,
  h6: 6
};

// Rank of a node if it is a heading element (h1..h6), else null.
const headingRank = (node: ElementContent): number | null => {
  if (node.type !== "element") return null;
  return HEADING_RANK[node.tagName] ?? null;
};

// Wrap heading-delimited runs of `nodes` into <section> elements. Only headings
// strictly deeper than `floor` delimit sections here, so a section body (whose
// own heading is at rank == floor) recurses to wrap just its deeper headings —
// yielding upstream's deepest-first nesting in one pass. Content before the
// first qualifying heading stays unwrapped. Operates on ElementContent[] so the
// produced <section> children type-check directly; a Doctype (Root-only) is
// handled at the plugin boundary and never reaches here.
const sectionizeChildren = (
  nodes: ElementContent[],
  floor: number
): ElementContent[] => {
  // Shallowest heading rank deeper than the floor.
  let minRank = Infinity;
  for (const node of nodes) {
    const rank = headingRank(node);
    if (rank !== null && rank > floor && rank < minRank) minRank = rank;
  }
  if (minRank === Infinity) return nodes;

  const result: ElementContent[] = [];
  let i = 0;

  // Preamble: everything before the first heading of the shallowest rank.
  while (i < nodes.length) {
    const node = nodes[i];
    if (node === undefined || headingRank(node) === minRank) break;
    result.push(node);
    i++;
  }

  // Each shallowest heading starts a section that runs until the next peer.
  while (i < nodes.length) {
    const start = i;
    i++;
    while (i < nodes.length) {
      const node = nodes[i];
      if (node === undefined || headingRank(node) === minRank) break;
      i++;
    }

    const between = nodes.slice(start, i);
    result.push({
      type: "element",
      tagName: "section",
      properties: { dataDepth: minRank },
      children: sectionizeChildren(between, minRank)
    } satisfies Element);
  }

  return result;
};

// A Root child is either ElementContent (comment | element | text) or a
// Doctype. A Doctype is never a heading and, in practice, only appears at the
// very top of a document, so it is kept as leading preamble ahead of the
// sections rather than fed into the wrapper.
const isElementContent = (node: RootContent): node is ElementContent =>
  node.type !== "doctype";

/** rehype plugin that wraps headings and their content in <section> elements. */
export const rehypeSectionize: Plugin<[], Root> = () => (tree) => {
  const preamble = tree.children.filter((node) => !isElementContent(node));
  const content = tree.children.filter(isElementContent);
  tree.children = [...preamble, ...sectionizeChildren(content, 0)];
};
