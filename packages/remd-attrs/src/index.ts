// Visitor callbacks receive generic Node — narrowing casts after a type
// discriminator are unavoidable. Defensive optional chains on array[i]
// accesses are also kept (noUncheckedIndexedAccess is off project-wide).
/* oxlint-disable typescript/no-unsafe-type-assertion */
/* oxlint-disable typescript/no-unnecessary-condition */
import { visit, SKIP } from "unist-util-visit";
import type { Visitor } from "unist-util-visit";
import type { Plugin, Transformer } from "unified";
import type {
  Root,
  Heading,
  Paragraph,
  List,
  ListItem,
  Code,
  TableCell
} from "mdast";
import type { Properties } from "hast";
import type { Node, Parent } from "unist";
import {
  containersKept,
  itemColumns,
  textEscapes,
  type LineContainer
} from "@mirrordown/core";
import { applyAttrs } from "./applyAttrs.js";
import { getDelimiterChecker } from "./getDelimiterChecker.js";
import type { AttrsOptions, DelimiterRange } from "./types.js";

export type {
  AttrsOptions,
  AttrRuleName,
  DelimiterConfig,
  Attr,
  DelimiterRange
} from "./types.js";

type AttrNode = Node & { data?: { hProperties?: Properties } };

/** Whether mdast-util-to-hast wraps a list's items' paragraphs in `<p>`, as it does for a loose list. */
const listLoose = (list: List | undefined): boolean =>
  !list ||
  Boolean(list.spread) ||
  list.children.some((item) => item.spread ?? item.children.length > 1);
type RuleSet = Set<string>;

const ALL_RULES = new Set([
  "fence",
  "inline",
  "table",
  "list",
  "heading",
  "hr",
  "softbreak",
  "block"
]);

const resolveRules = (rule: AttrsOptions["rule"]): RuleSet => {
  if (rule === false || (Array.isArray(rule) && rule.length === 0))
    return new Set();
  if (rule === "all" || rule === true || rule === undefined) return ALL_RULES;
  return new Set((rule as string[]).filter((r) => ALL_RULES.has(r)));
};

/** Reads a block closing `content`, the text of `node` or its last line, unless the source escapes it. */
type BlockReader = (
  node: Node,
  content: string,
  pos: "end" | "only"
) => DelimiterRange | null;

// Shared visitor for list/table/hr: apply attrs from a standalone paragraph
// to the preceding sibling of the given type, then remove the paragraph.
const makeSiblingAttrVisitor =
  (
    siblingType: string,
    blockAt: BlockReader,
    allowed: Array<string | RegExp>
  ): Visitor =>
  (node: Node, index: number | undefined, parent: Parent | undefined) => {
    if (!parent || typeof index === "undefined") return;
    if (node.type !== "paragraph") return;
    const para = node as Paragraph;
    if (para.children.length !== 1 || para.children[0].type !== "text") return;
    const content = para.children[0].value.trim();
    const range = blockAt(para.children[0], content, "only");
    if (!range) return;
    const prev = parent.children[index - 1];
    if (!prev || prev.type !== siblingType) return;
    applyAttrs(prev, content, range, allowed);
    parent.children.splice(index, 1);
    return [SKIP, index];
  };

/** remark plugin for attribute lists (`{.class #id key=value}`) on elements. */
export const remarkAttrs: Plugin<[AttrsOptions?], Root> = (options = {}) => {
  const { left = "{", right = "}", allowed = [], rule } = options;
  const rules = resolveRules(rule);
  const check = getDelimiterChecker(left, right);

  const transformer: Transformer<Root> = (tree, file) => {
    // remark resolves `\{` and `&#123;` before any plugin runs, so a text node's value can't tell an escaped delimiter from a real one. markdown-it and Sätteri keep a block as text when a delimiter, or anything inside it, is escaped or written as a character reference; here the source the node was read from tells the same: the block must be written there as it reads. A node with no position is one another plugin built: a span plugin records which characters of the text it rebuilt were escaped (`data.escaped`, read by `textEscapes`), and a block holding one of them stays text. Without a record the node is taken at its word.
    const source = String(file.value);
    const written = (
      node: Node,
      block: string,
      at: "start" | "end",
      skip = 0
    ): boolean => {
      const from = node.position?.start.offset;
      const to = node.position?.end.offset;
      if (from === undefined || to === undefined) {
        const value = (node as { value?: unknown }).value;
        if (typeof value !== "string") return true;
        const begin =
          at === "start" ? skip : value.trimEnd().length - block.length;
        for (const index of textEscapes(node, source))
          if (index >= begin && index < begin + block.length) return false;
        return true;
      }
      const raw = source.slice(from, to);
      // Nothing is escaped without a backslash, nor referenced without an ampersand.
      if (!raw.includes("\\") && !raw.includes("&")) return true;
      if (at === "start") return raw.startsWith(block, skip);
      const text = raw.trimEnd();
      if (!text.endsWith(block)) return false;
      // `\{` is a literal brace, `\\{` a literal backslash before a real one.
      let slashes = 0;
      let before = text.length - block.length - 1;
      while (before >= 0 && text[before] === "\\") {
        slashes++;
        before--;
      }
      return slashes % 2 === 0;
    };
    const blockAt: BlockReader = (node, content, pos) => {
      const range = check(content, pos);
      if (!range) return null;
      return written(node, content.slice(range[0] - left.length), "end")
        ? range
        : null;
    };

    // â”€â”€ fence: code block with attrs in lang string â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (rules.has("fence")) {
      visit(tree, "code", (node: Code) => {
        // remark splits the info string at its first space into `lang` and
        // `meta`, wherever that space is: a block is all of `meta` after a
        // language (```js {.x}), but opens in `lang` without one (``` {.a .b})
        // or right after one (```js{.a .b}). Read it from the two rejoined.
        const value = [node.lang, node.meta].filter(Boolean).join(" ").trim();
        if (!value) return;
        const range = check(value, "end") ?? check(value, "only");
        if (!range) return;
        applyAttrs(node, value, range, allowed);
        const rest = value.slice(0, range[0] - left.length).trimEnd();
        const space = rest.search(/\s/);
        node.lang = (space === -1 ? rest : rest.slice(0, space)) || null;
        node.meta = space === -1 ? null : rest.slice(space).trim() || null;
        // mdast-util-to-hast puts the language class in `className` before
        // applying hProperties; merge the attr classes into it (attr classes
        // first, as markdown-it renders them) instead of adding a second key.
        const props = (node as AttrNode).data?.hProperties;
        if (node.lang && typeof props?.class === "string") {
          props.className = [
            ...props.class.split(" "),
            `language-${node.lang}`
          ];
          delete props.class;
        }
      });
    }

    // â”€â”€ inline: attrs after inline elements (em, strong, etc.) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Runs before the block rules, as in markdown-it-attrs, so `**b**{.x}`
    // ending a heading or list item goes on the `strong`.
    if (rules.has("inline")) {
      // Any node holding inline content: paragraphs, headings, table cells
      // and the inline elements themselves, for nested ones.
      visit(tree, (node: Node) => {
        if (!("children" in node)) return;
        const children = (node as Paragraph).children;
        for (let i = children.length - 1; i >= 1; i--) {
          const child = children[i];
          const prev = children[i - 1];
          if (child?.type !== "text") continue;
          if (!prev) continue;

          // Blocks that open the text right after an element go on it, and
          // the text after them stays, as in markdown-it-attrs.
          let content = child.value;
          let range = check(content, "start");
          if (!range) continue;

          // Raw HTML and a footnote reference can't carry attributes (a block
          // given to them would be lost, or land on a generated `<sup>`), so
          // theirs is left for the end-of-block rule, as in mdit-attrs.
          const prevType = prev.type;
          if (
            prevType === "text" ||
            prevType === "break" ||
            prevType === "html" ||
            prevType === "footnoteReference"
          )
            continue;

          // How much of the node's source the blocks read so far take up.
          let taken = 0;
          while (range) {
            const length = range[1] + right.length;
            if (!written(child, content.slice(0, length), "start", taken))
              break;
            applyAttrs(prev, content, range, allowed);
            taken += length;
            content = content.slice(length);
            range = check(content, "start");
          }
          if (taken === 0) continue;
          if (content) child.value = content;
          else children.splice(i, 1);
        }
      });
    }

    // softbreak: a block on a line of its own, ending a paragraph or setext
    // heading after a soft or hard break, goes on the block that ends right
    // before it at the level the line is written, as kramdown places a block
    // IAL: the paragraph (its list item, in a tight list), or, for a line lazily
    // written outside some of the blockquotes and list items around it, the
    // outermost of those it leaves (a list item's list). Runs before the list
    // rule, so the item then reads a block ending its first line.
    if (rules.has("softbreak")) {
      // The source lines and the parent map serve only a block found on a line of its own, so
      // they are built on the first one: most documents have none, and building them cost a
      // split of the whole source plus a full extra walk per document.
      let lines: string[] | undefined;
      let parents: Map<Node, Parent> | undefined;
      const parentsOf = (): Map<Node, Parent> => {
        if (parents) return parents;
        const map = new Map<Node, Parent>();
        visit(tree, (node: Node, _index, parent: Parent | undefined) => {
          if (parent) map.set(node, parent);
        });
        parents = map;
        return map;
      };
      visit(tree, (node: Node) => {
        if (node.type !== "paragraph" && node.type !== "heading") return;
        const children = (node as Paragraph).children;
        const last = children[children.length - 1];
        if (last?.type !== "text") return;
        const hard = children[children.length - 2]?.type === "break";
        const lineStart = last.value.trimEnd().lastIndexOf("\n");
        if (!hard && lineStart === -1) return;
        const content = last.value.slice(lineStart + 1).trim();
        const range = blockAt(last, content, "only");
        if (!range) return;
        const parentMap = parentsOf();
        lines ??= String(file.value).split(/\r?\n/);

        // The blockquotes and list items around the block, outermost first.
        const ancestors: Parent[] = [];
        for (let p = parentMap.get(node); p; p = parentMap.get(p))
          ancestors.unshift(p);
        const containers: Array<{
          target: Node;
          line: LineContainer;
          /** The line a list item opens on. */
          opens?: number;
        }> = [];
        for (const [i, ancestor] of ancestors.entries()) {
          const start = ancestor.position?.start;
          if (ancestor.type === "blockquote" && start) {
            // Its own `>` and those before it on its first line, for the
            // blockquotes (or panels made from them) it's nested in.
            const before = (lines[start.line - 1] ?? "").slice(
              0,
              start.column - 1
            );
            containers.push({
              target: ancestor,
              line: { kind: "quote", markers: before.split(">").length }
            });
          } else if (ancestor.type === "listItem") {
            if (!start) return;
            // The column the item's content starts at, read from its marker's
            // line as mdit-attrs does. The item's first child doesn't always
            // start there: a task item's paragraph starts after `[x] `. Items
            // opened on the same line, outside this one, come first there.
            const before = containers.filter(
              (c) => c.opens === start.line
            ).length;
            const column = itemColumns(lines[start.line - 1] ?? "").at(before);
            if (column === undefined) return;
            containers.push({
              target: ancestors[i - 1] ?? ancestor,
              line: { kind: "item", column },
              opens: start.line
            });
          }
        }

        const end = last.position?.end;
        const kept = end
          ? containersKept(
              lines[end.line - 1] ?? "",
              containers.map((c) => c.line)
            )
          : containers.length;
        const parent = parentMap.get(node);
        let target = node;
        if (kept < containers.length) target = containers[kept].target;
        // A tight list hides its paragraphs, so the item shows the attributes.
        else if (
          parent?.type === "listItem" &&
          !listLoose(parentMap.get(parent) as List)
        )
          target = parent;
        applyAttrs(target, content, range, allowed);

        // Keep a hard break, as markdown-it-attrs does; drop only the attrs.
        if (lineStart === -1) children.pop();
        else last.value = last.value.slice(0, lineStart).trimEnd();
      });
    }

    // â”€â”€ heading: attrs at end of heading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (rules.has("heading")) {
      visit(tree, "heading", (node: Heading) => {
        const last = node.children[node.children.length - 1];
        if (last?.type !== "text") return;
        const content = last.value.trimEnd();
        const range = blockAt(last, content, "end");
        if (!range) return;
        applyAttrs(node, content, range, allowed);
        const attrStart = content.lastIndexOf(left, range[0] - 1);
        last.value = content.slice(0, attrStart).trimEnd();
        if (last.value === "" && node.children.length > 1) node.children.pop();
      });
    }

    // list: attrs closing a list item's first paragraph. Runs before `block`,
    // which would otherwise give them to a paragraph that a tight list hides.
    if (rules.has("list")) {
      visit(tree, "listItem", (node: ListItem) => {
        const para = node.children[0];
        if (para?.type !== "paragraph") return;
        const last = para.children[para.children.length - 1];
        if (last?.type !== "text") return;

        const content = last.value.trimEnd();
        const range = blockAt(last, content, "end");
        if (!range) return;
        applyAttrs(node, content, range, allowed);
        const attrStart = content.lastIndexOf(left, range[0] - 1);
        last.value = content.slice(0, attrStart).trimEnd();
        if (last.value === "" && para.children.length > 1) para.children.pop();
      });
    }

    // table: attrs at the end of a cell apply to that cell (`td` or `th`).
    if (rules.has("table")) {
      visit(tree, "tableCell", (node: TableCell) => {
        const last = node.children[node.children.length - 1];
        if (last?.type !== "text") return;
        const content = last.value.trimEnd();
        const range = blockAt(last, content, "end");
        if (!range) return;
        applyAttrs(node, content, range, allowed);
        const attrStart = content.lastIndexOf(left, range[0] - 1);
        last.value = content.slice(0, attrStart).trimEnd();
        if (last.value === "" && node.children.length > 1) node.children.pop();
      });
    }

    // â”€â”€ list: attrs at end of list item / standalone paragraph after list â”€
    if (rules.has("list")) {
      visit(tree, makeSiblingAttrVisitor("list", blockAt, allowed));

      // â”€â”€ custom containerItem nodes (data.attrsRole === "containerItem") â”€â”€
      // Third-party plugins opt in by setting data.attrsRole = "containerItem" and
      // exposing their title content in data.attrsTitle: PhrasingContent[].
      visit(tree, (node: Node) => {
        const n = node as {
          type: string;
          data?: {
            attrsRole?: string;
            attrsTitle?: Array<{ type: string; value: string }>;
            hProperties?: Properties;
          };
        };
        if (n.data?.attrsRole !== "containerItem" || !n.data.attrsTitle) return;
        const title = n.data.attrsTitle;
        const last = title[title.length - 1];
        if (last?.type !== "text") return;
        const content = last.value.trimEnd();
        const range = blockAt(last, content, "end");
        if (!range) return;
        applyAttrs(node, content, range, allowed);
        const attrStart = content.lastIndexOf(left, range[0] - 1);
        last.value = content.slice(0, attrStart).trimEnd();
      });

      // â”€â”€ custom container nodes (data.attrsRole === "container") â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      // Third-party plugins opt in by setting data.attrsRole = "container".
      // A standalone attr paragraph after such a node applies to the node itself.
      visit(
        tree,
        (node: Node, index: number | undefined, parent: Parent | undefined) => {
          if (!parent || typeof index === "undefined") return;
          if (node.type !== "paragraph") return;
          const para = node as Paragraph;
          if (para.children.length !== 1 || para.children[0].type !== "text")
            return;
          const content = para.children[0].value.trim();
          const range = blockAt(para.children[0], content, "only");
          if (!range) return;
          const prev = parent.children[index - 1] as
            | { data?: { attrsRole?: string } }
            | undefined;
          if (prev?.data?.attrsRole !== "container") return;
          applyAttrs(prev as unknown as AttrNode, content, range, allowed);
          parent.children.splice(index, 1);
          return [SKIP, index];
        }
      );
    }

    // â”€â”€ table: standalone paragraph after table containing only attrs â”€â”€â”€â”€â”€
    if (rules.has("table")) {
      visit(tree, makeSiblingAttrVisitor("table", blockAt, allowed));
    }

    // â”€â”€ hr: standalone paragraph after thematic break containing only attrs
    if (rules.has("hr")) {
      visit(tree, makeSiblingAttrVisitor("thematicBreak", blockAt, allowed));
    }

    // â”€â”€ block: paragraph with trailing attrs on last text child â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Runs last, as markdown-it-attrs' "end of block" does: an attr block that
    // belongs to an inline element, a list, a table or a rule is claimed by
    // those rules first.
    if (rules.has("block")) {
      visit(tree, "paragraph", (node: Paragraph) => {
        const last = node.children[node.children.length - 1];
        if (last?.type !== "text") return;
        const content = last.value.trimEnd();
        const range = blockAt(last, content, "end");
        if (!range) return;
        applyAttrs(node, content, range, allowed);
        const attrStart = content.lastIndexOf(left, range[0] - 1);
        last.value = content.slice(0, attrStart).trimEnd();
        if (last.value === "" && node.children.length > 1) node.children.pop();
      });
    }
  };

  return transformer;
};
