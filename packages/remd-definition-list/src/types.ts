import type { Parent, PhrasingContent } from "mdast";
import type { Properties } from "hast";
import type { Token } from "micromark-util-types";

export const tokenTypes = {
  defList: "defList",
  defListTerm: "defListTerm",
  defListDescriptionMarker: "defListDescriptionMarker",
  defListDescriptionPrefix: "defListDescriptionPrefix",
  defListDescriptionPrefixWhitespace: "defListDescriptionPrefixWhitespace",
  defListDescription: "defListDescription"
} as const;

export type TokenType = (typeof tokenTypes)[keyof typeof tokenTypes];

export interface DefinitionList extends Parent {
  type: "defList";
  children: Array<DefinitionTerm | DefinitionDescription>;
  data?: { attrsRole?: string; hProperties?: Properties };
}

export interface DefinitionTerm extends Parent {
  type: "defListTerm";
  data?: {
    attrsRole?: string;
    attrsTitle?: PhrasingContent[];
    hProperties?: Properties;
  };
}

export interface DefinitionDescription extends Parent {
  type: "defListDescription";
  spread: boolean;
  data?: { hProperties?: Properties };
}

export const clonePoint = <T extends object>(p: T): T => ({ ...p });

export type FlowToken = Token & {
  _tokenizer?: {
    events: Array<[string, Token, unknown]>;
  };
  previous?: Token;
  next?: Token;
};
