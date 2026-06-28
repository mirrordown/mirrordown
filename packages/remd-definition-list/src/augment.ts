import type {
  DefinitionList,
  DefinitionTerm,
  DefinitionDescription
} from "./types";

// Registers the defList token types (micromark) and node types (mdast). JSR
// forbids module augmentation, so this file is kept out of the JSR entrypoint
// (jsr.ts) and only reaches the npm build via index.ts. See jsr.json.
declare module "micromark-util-types" {
  interface TokenTypeMap {
    defList: "defList";
    defListTerm: "defListTerm";
    defListDescriptionMarker: "defListDescriptionMarker";
    defListDescriptionPrefix: "defListDescriptionPrefix";
    defListDescriptionPrefixWhitespace: "defListDescriptionPrefixWhitespace";
    defListDescription: "defListDescription";
  }

  interface ContainerState {
    type?: keyof TokenTypeMap;
    size?: number;
    lastBlankLine?: boolean;
    furtherBlankLines?: boolean;
    _closeFlow?: boolean;
    hadBlankInDescription?: boolean;
  }

  interface Token {
    _loose?: boolean;
    _container?: boolean;
    _prevLoose?: boolean;
  }
}

declare module "mdast" {
  interface RootContentMap {
    defList: DefinitionList;
    defListTerm: DefinitionTerm;
    defListDescription: DefinitionDescription;
  }

  interface BlockContentMap {
    defList: DefinitionList;
  }
}
