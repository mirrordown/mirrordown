export type {
  TabsItemNode,
  TabsLabelNode,
  TabsListNode
} from "@mirrordown/core";

/** Options for the {@link remarkTabs} plugin. */
export interface TabsOptions {
  /** Class applied to the tabs container element (default `markdown-tabs`). */
  containerClass?: string;
}
