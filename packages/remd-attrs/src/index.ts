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
import { containersKept, type LineContainer } from "@mirrordown/core";
import { applyAttrs } from "./applyAttrs.js";
import { getDelimiterChecker } from "./getDelimiterChecker.js";
import type { AttrsOptions } from "./types.js";

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

// Shared visitor for list/table/hr: apply attrs from a standalone paragraph
// to the preceding sibling of the given type, then remove the paragraph.
const makeSiblingAttrVisitor =
  (
    siblingType: string,
    check: ReturnType<typeof getDelimiterChecker>,
    allowed: Array<string | RegExp>
  ): Visitor =>
  (node: Node, index: number | undefined, parent: Parent | undefined) => {
    if (!parent || typeof index === "undefined") return;
    if (node.type !== "paragraph") return;
    const para = node as Paragraph;
    if (para.children.length !== 1 || para.children[0].type !== "text") return;
    const content = para.children[0].value.trim();
    const range = check(content, "only");
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
    // â”€â”€ fence: code block with attrs in lang string â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (rules.has("fence")) {
      visit(tree, "code", (node: Code) => {
        // remark puts text after the language in `meta` (```js {.x}); with no
        // language, the attrs are the whole `lang` (``` {.x}).
        const field = node.meta?.trim() ? "meta" : "lang";
        const value = node[field]?.trim() ?? "";
        if (!value) return;
        const range = check(value, "end") ?? check(value, "only");
        if (!range) return;
        applyAttrs(node, value, range, allowed);
        node[field] =
          value.slice(0, value.lastIndexOf(left, range[0] - 1)).trimEnd() ||
          null;
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

          const prevType = prev.type;
          if (prevType === "text" || prevType === "break") continue;

          while (range) {
            applyAttrs(prev, content, range, allowed);
            content = content.slice(range[1] + right.length);
            range = check(content, "start");
          }
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
      const lines = String(file.value).split(/\r?\n/);
      const parents = new Map<Node, Parent>();
      visit(tree, (node: Node, _index, parent: Parent | undefined) => {
        if (parent) parents.set(node, parent);
      });
      visit(tree, (node: Node) => {
        if (node.type !== "paragraph" && node.type !== "heading") return;
        const children = (node as Paragraph).children;
        const last = children[children.length - 1];
        if (last?.type !== "text") return;
        const hard = children[children.length - 2]?.type === "break";
        const lineStart = last.value.trimEnd().lastIndexOf("\n");
        if (!hard && lineStart === -1) return;
        const content = last.value.slice(lineStart + 1).trim();
        const range = check(content, "only");
        if (!range) return;

        // The blockquotes and list items around the block, outermost first.
        const ancestors: Parent[] = [];
        for (let p = parents.get(node); p; p = parents.get(p))
          ancestors.unshift(p);
        const containers: Array<{ target: Node; line: LineContainer }> = [];
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
            const first = ancestor.children[0]?.position?.start;
            if (!first) return;
            containers.push({
              target: ancestors[i - 1] ?? ancestor,
              line: { kind: "item", column: first.column - 1 }
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
        const parent = parents.get(node);
        let target = node;
        if (kept < containers.length) target = containers[kept].target;
        // A tight list hides its paragraphs, so the item shows the attributes.
        else if (
          parent?.type === "listItem" &&
          !listLoose(parents.get(parent) as List)
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
        const range = check(content, "end");
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
        const range = check(content, "end");
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
        const range = check(content, "end");
        if (!range) return;
        applyAttrs(node, content, range, allowed);
        const attrStart = content.lastIndexOf(left, range[0] - 1);
        last.value = content.slice(0, attrStart).trimEnd();
        if (last.value === "" && node.children.length > 1) node.children.pop();
      });
    }

    // â”€â”€ list: attrs at end of list item / standalone paragraph after list â”€
    if (rules.has("list")) {
      visit(tree, makeSiblingAttrVisitor("list", check, allowed));

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
        const range = check(content, "end");
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
          const range = check(content, "only");
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
      visit(tree, makeSiblingAttrVisitor("table", check, allowed));
    }

    // â”€â”€ hr: standalone paragraph after thematic break containing only attrs
    if (rules.has("hr")) {
      visit(tree, makeSiblingAttrVisitor("thematicBreak", check, allowed));
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
        const range = check(content, "end");
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
