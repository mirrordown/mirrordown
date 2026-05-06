import type { Parent } from "mdast";
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
}

export interface DefinitionTerm extends Parent {
  type: "defListTerm";
}

export interface DefinitionDescription extends Parent {
  type: "defListDescription";
  spread: boolean;
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

export type FlowToken = Token & {
  _tokenizer?: {
    events: Array<[string, Token, unknown]>;
  };
  previous?: Token;
  next?: Token;
};
