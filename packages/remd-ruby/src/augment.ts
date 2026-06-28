import type { Ruby } from "./plugin";

// Registers the ruby token types (micromark) and node type (mdast). JSR forbids
// module augmentation, so this file is kept out of the JSR entrypoint (jsr.ts)
// and only reaches the npm build via index.ts. See jsr.json.
declare module "micromark-util-types" {
  interface TokenTypeMap {
    ruby: "ruby";
    rubyMarker: "rubyMarker";
    rubyBaseData: "rubyBaseData";
    rubyReadingData: "rubyReadingData";
  }
}

declare module "mdast" {
  interface PhrasingContentMap {
    ruby: Ruby;
  }

  interface RootContentMap {
    ruby: Ruby;
  }
}
