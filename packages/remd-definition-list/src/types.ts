import type { Parent, PhrasingContent } from "mdast";
import type { Properties } from "hast";
import type { Token } from "micromark-util-types";

export const tokenTypes = {
  defList: "defList",
  defListTerm: "defListTerm",
  defListDescriptionMarker: "defListDescriptionMarker",
  defListDescriptionPrefix: "defListDescriptionPrefix",
  defListDescriptionPrefixWhitespace: "defListDescriptionPrefixWhitespace",
  defListDescription: "defListDescription",
} as const;

export type TokenType = (typeof tokenTypes)[keyof typeof tokenTypes];

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

export interface DefinitionList extends Parent {
  type: "defList";
  children: Array<DefinitionTerm | DefinitionDescription>;
  data?: { attrsRole?: string; hProperties?: Properties };
}

export interface DefinitionTerm extends Parent {
  type: "defListTerm";
  data?: { attrsRole?: string; attrsTitle?: PhrasingContent[]; hProperties?: Properties };
}

export interface DefinitionDescription extends Parent {
  type: "defListDescription";
  spread: boolean;
  data?: { hProperties?: Properties };
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

export const clonePoint = <T extends object>(p: T): T => ({ ...p }) as T;

export type FlowToken = Token & {
  _tokenizer?: {
    events: Array<[string, Token, unknown]>;
  };
  previous?: Token;
  next?: Token;
};
