import type { TabsListNode, TabsItemNode, TabsLabelNode } from "./types";

// Registers the tabsList/tabsItem node types on mdast so consumers get typed
// trees. JSR forbids module augmentation, so this file is kept out of the JSR
// entrypoint (jsr.ts) and only reaches the npm build via index.ts. See jsr.json.
declare module "mdast" {
  interface RootContentMap {
    tabsList: TabsListNode;
    tabsItem: TabsItemNode;
    tabsLabel: TabsLabelNode;
  }
  interface BlockContentMap {
    tabsList: TabsListNode;
  }
}
