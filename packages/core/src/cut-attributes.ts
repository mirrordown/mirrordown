// Attribute blocks a lazily continued header hid: a tab or step header right after a body's last paragraph continues it in CommonMark, so a parser that reads attribute blocks before recognition (Sätteri) finds the paragraph's last block mid-paragraph and keeps it as text. Recognition cuts the paragraph before the header; these blocks then end it, and go where the parser would have put them, as markdown-it and remark (whose attrs run after recognition) do.
import type { Paragraph, PhrasingContent, Root, RootContent } from "mdast";
import type { Properties } from "hast";

/** Paragraphs recognition rebuilt from lines, as it does where a tab or step header lazily continued them. */
export const rebuiltParagraphs = new WeakSet<Paragraph>();

/** The properties an attribute block written after text gives the text's paragraph, as the parser reads them, or `undefined` if it isn't one. */
export type ReadAttributes = (block: string) => Properties | undefined;

type Node = Root | RootContent;
type Parent = Extract<Node, { children: unknown }>;

/** Joins `added` into `properties`: classes accumulate, other attributes replace. */
const mergeProperties = (
  properties: Properties | undefined,
  added: Properties
): Properties => {
  const merged: Properties = { ...properties };
  for (const [key, value] of Object.entries(added)) {
    const existing = merged[key];
    merged[key] =
      key === "className" && Array.isArray(existing) && Array.isArray(value)
        ? [...existing, ...value]
        : value;
  }
  return merged;
};

// Whether mdast-util-to-hast wraps the list's paragraphs in `<p>`, as it does in a loose list.
const listLoose = (list: Node | undefined): boolean =>
  list?.type !== "list" ||
  Boolean(list.spread) ||
  list.children.some((item) => item.spread ?? item.children.length > 1);

/**
 * Places the attribute block now ending each paragraph recognition rebuilt (one a header was cut from), as the parser places one: a block on a line of its own goes on the block it's written after, at the level its `>` markers and indentation put it (the paragraph, its list item in a tight list, or the outermost blockquote or list item it's written outside of, a list item giving its list); a block after text goes on the paragraph, or its list item from the item's first paragraph.
 */
export const placeCutAttributes = (
  root: Root,
  sourceLines: readonly string[],
  read: ReadAttributes
): void => {
  const parents = new Map<Node, Parent>();
  const cut: Paragraph[] = [];
  const walk = (node: Node): void => {
    if (node.type === "paragraph" && rebuiltParagraphs.has(node))
      cut.push(node);
    if (!("children" in node)) return;
    for (const child of node.children) {
      parents.set(child, node);
      walk(child);
    }
  };
  walk(root);

  for (const para of cut) {
    const children: PhrasingContent[] = para.children;
    const last = children.at(-1);
    if (last?.type !== "text") continue;
    const value = last.value.trimEnd();
    const lineStart = value.lastIndexOf("\n");
    const line = value.slice(lineStart + 1);
    const open = line.lastIndexOf("{");
    if (open === -1) continue;
    const properties = read(line.slice(open));
    if (!properties) continue;
    const before = line.slice(0, open);
    const ownLine =
      before.trim() === "" &&
      (lineStart !== -1 || children.at(-2)?.type === "break");
    // A block after an element on its line was the element's to take.
    if (before === "" && !ownLine) continue;

    const ancestors: Parent[] = [];
    for (let p = parents.get(para); p; p = parents.get(p)) ancestors.unshift(p);
    const parent = ancestors.at(-1);

    let target: Node = para;
    if (ownLine) {
      const end = last.position?.end;
      const written = end ? (sourceLines[end.line - 1] ?? "") : "";
      const prefix = /^[ \t>]*/.exec(written)?.[0] ?? "";
      const markers = prefix.split(">").length - 1;
      const outside = end
        ? ancestors.findIndex((ancestor) => {
            const start = ancestor.position?.start;
            if (ancestor.type === "blockquote" && start) {
              const own = (sourceLines[start.line - 1] ?? "").slice(
                0,
                start.column - 1
              );
              return markers < own.split(">").length;
            }
            const first =
              ancestor.type === "listItem"
                ? ancestor.children[0]?.position?.start
                : undefined;
            return first !== undefined && prefix.length < first.column - 1;
          })
        : -1;
      const container = ancestors[outside];
      if (container)
        target =
          container.type === "listItem"
            ? (ancestors[outside - 1] ?? container)
            : container;
      else if (parent?.type === "listItem" && !listLoose(ancestors.at(-2)))
        target = parent;
    } else if (parent?.type === "listItem" && parent.children[0] === para) {
      target = parent;
    }

    const data: { hProperties?: Properties } | undefined = target.data;
    target.data = {
      ...data,
      hProperties: mergeProperties(data?.hProperties, properties)
    };
    const kept = ownLine
      ? value.slice(0, Math.max(lineStart, 0))
      : value.slice(0, lineStart + 1) + before;
    if (kept.trimEnd() === "") children.pop();
    else last.value = kept.trimEnd();
  }
};
