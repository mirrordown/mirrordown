import type { PhrasingContent, BlockContent, DefinitionContent } from "mdast";
import type { Properties } from "hast";

export interface TabsOptions {
  containerClass?: string;
}

// ── MDAST node types ──────────────────────────────────────────────────────────

export interface TabsListNode {
  type: "tabsList";
  depth: number;
  containerClass?: string;
  groupId: string;
  blockId: string;
  children: TabsItemNode[];
  data?: { attrsRole?: string; hProperties?: Properties };
}

export interface TabsItemNode {
  type: "tabsItem";
  depth: number;
  label: PhrasingContent[];
  labelText: string; // plain-text version for aria-label and data-tab
  open: boolean;
  children: Array<BlockContent | DefinitionContent | TabsListNode>;
  data?: {
    attrsRole?: string;
    attrsTitle?: PhrasingContent[];
    attrsItemTitle?: boolean;
    hProperties?: Properties;
  };
}
