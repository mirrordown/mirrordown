import type { Superscript } from "./plugin";

// Registers the `superscript` node in mdast's content maps so consumers get
// typed trees. JSR forbids module augmentation ("modifying global types is not
// allowed"), so this file is kept out of the JSR entrypoint (jsr.ts) and only
// reaches the npm build via index.ts. See jsr.json / index.ts.
declare module "mdast" {
  interface PhrasingContentMap {
    superscript: Superscript;
  }

  interface RootContentMap {
    superscript: Superscript;
  }
}
