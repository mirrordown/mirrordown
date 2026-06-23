// Visitor callbacks receive generic Node — narrowing casts after a type
// discriminator are unavoidable. Defensive optional chains on array[i]
// accesses are also kept (noUncheckedIndexedAccess is off project-wide).
/* oxlint-disable typescript/no-unsafe-type-assertion */
/* oxlint-disable typescript/no-unnecessary-condition */
import { visit, SKIP } from "unist-util-visit";
import type { Visitor } from "unist-util-visit";
import type { Plugin, Transformer } from "unified";
import type { Root, Heading, Paragraph, ListItem, Code } from "mdast";
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
    applyAttrs(prev as AttrNode, content, range, allowed);
    parent.children.splice(index, 1);
    return [SKIP, index];
  };

export const remarkAttrs: Plugin<[AttrsOptions?], Root> = (options = {}) => {
  const { left = "{", right = "}", allowed = [], rule } = options;
  const rules = resolveRules(rule);
  const check = getDelimiterChecker(left, right);

  const transformer: Transformer<Root> = (tree) => {
    // â”€â”€ fence: code block with attrs in lang string â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (rules.has("fence")) {
      visit(tree, "code", (node: Code) => {
        const lang = node.lang?.trim() ?? "";
        if (!lang) return;
        const range = check(lang, "end") ?? check(lang, "only");
        if (!range) return;
        applyAttrs(node, lang, range, allowed);
        node.lang =
          lang.slice(0, lang.lastIndexOf(left, range[0] - 1)).trimEnd() || null;
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

    // â”€â”€ block: paragraph with trailing attrs on last text child â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        children.splice(children.length - 2, 2);
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

          applyAttrs(prev as AttrNode, content, range, allowed);
          children.splice(i, 1);
        }
      });
    }

    // â”€â”€ list: attrs at end of list item / standalone paragraph after list â”€
    if (rules.has("list")) {
      visit(tree, "listItem", (node: ListItem) => {
        const firstChild = node.children[0];
        if (firstChild?.type !== "paragraph") return;
        const para = firstChild;
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
        applyAttrs(node as AttrNode, content, range, allowed);
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
  };

  return transformer;
};
