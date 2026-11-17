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
  // The body's lines without their `>` marker; `null` for a blank line written without one, which ends the blocks before it as it ends a blockquote.
  bodyLines: Array<string | null>;
}

export interface TabsBlock {
  frames: TabFrame[];
  currentDepth: number;
}
