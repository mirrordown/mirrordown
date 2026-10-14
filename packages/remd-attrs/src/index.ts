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
  ListItem,
  Code,
  TableCell
} from "mdast";
import type { Properties } from "hast";
import type { Node, Parent } from "unist";
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

  const transformer: Transformer<Root> = (tree) => {
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
      visit(
        tree,
        "listItem",
        (
          node: ListItem,
          _index: number | undefined,
          parent: Parent | undefined
        ) => {
          const para = node.children[0];
          if (para?.type !== "paragraph") return;
          const last = para.children[para.children.length - 1];
          if (last?.type !== "text") return;

          // An attr line lazily continuing the paragraph applies to the list
          // holding the item, as markdown-it-attrs' "list softbreak" does.
          const lineStart = last.value.lastIndexOf("\n");
          if (lineStart !== -1 && parent?.type === "list") {
            const line = last.value.slice(lineStart + 1).trim();
            const lineRange = check(line, "only");
            if (lineRange) {
              applyAttrs(parent, line, lineRange, allowed);
              last.value = last.value.slice(0, lineStart).trimEnd();
              if (last.value === "") para.children.pop();
              return;
            }
          }

          const content = last.value.trimEnd();
          const range = check(content, "end");
          if (!range) return;
          applyAttrs(node, content, range, allowed);
          const attrStart = content.lastIndexOf(left, range[0] - 1);
          last.value = content.slice(0, attrStart).trimEnd();
          if (last.value === "" && para.children.length > 1)
            para.children.pop();
        }
      );
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

    // â”€â”€ softbreak: attr block after softbreak in paragraph â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (rules.has("softbreak")) {
      visit(tree, "paragraph", (node: Paragraph) => {
        const children = node.children;
        if (children.length < 2) return;
        const last = children[children.length - 1];
        const prev = children[children.length - 2];
        if (last?.type !== "text") return;
        if (prev?.type !== "break") return;
        const content = last.value.trim();
        const range = check(content, "only");
        if (!range) return;
        applyAttrs(node, content, range, allowed);
        // Keep the hard break, as markdown-it-attrs does; drop only the attrs.
        children.pop();
      });
    }

    // â”€â”€ inline: attrs after inline elements (em, strong, etc.) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (rules.has("inline")) {
      visit(tree, "paragraph", (node: Paragraph) => {
        const children = node.children;
        for (let i = children.length - 1; i >= 1; i--) {
          const child = children[i];
          const prev = children[i - 1];
          if (child?.type !== "text") continue;
          if (!prev) continue;

          const content = child.value;
          const range = check(content, "only");
          if (!range) continue;

          const prevType = prev.type;
          if (prevType === "text" || prevType === "break") continue;

          applyAttrs(prev, content, range, allowed);
          children.splice(i, 1);
        }
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
