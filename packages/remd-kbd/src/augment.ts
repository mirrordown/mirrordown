import type { Kbd } from "./plugin";

// Registers the kbd node type on mdast so consumers get typed trees. JSR forbids
// module augmentation, so this file is kept out of the JSR entrypoint (jsr.ts)
// and only reaches the npm build via index.ts. See jsr.json.
declare module "mdast" {
  interface PhrasingContentMap {
    kbd: Kbd;
  }

  interface RootContentMap {
    kbd: Kbd;
  }
}
