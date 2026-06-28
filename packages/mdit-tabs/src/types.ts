/** Options for the tabs plugin. */
export interface TabsOptions {
  /** Class applied to the tabs container element (default `markdown-tabs`). */
  containerClass?: string;
}

// ── Internal parser structures ────────────────────────────────────────────────

export interface TabFrame {
  depth: number;
  label: string; // raw label text (for inline parsing later)
  open: boolean; // true if marked with %+
  bodyLines: string[]; // continuation lines with > prefix stripped
}

export interface TabsBlock {
  frames: TabFrame[];
  currentDepth: number;
}
