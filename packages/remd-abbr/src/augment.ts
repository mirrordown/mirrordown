import type { Data } from "unist";
import type { PhrasingContent } from "mdast";

// Registers the abbr node type on mdast so consumers get typed trees. JSR
// forbids module augmentation, so this file is kept out of the JSR entrypoint
// (jsr.ts) and only reaches the npm build via index.ts. See jsr.json.
interface AbbrData extends Data {
  hName: "abbr";
  hProperties: { title: string };
}

interface Abbr {
  type: "abbr";
  children: PhrasingContent[];
  data: AbbrData;
}

declare module "mdast" {
  interface PhrasingContentMap {
    abbr: Abbr;
  }

  interface RootContentMap {
    abbr: Abbr;
  }
}
