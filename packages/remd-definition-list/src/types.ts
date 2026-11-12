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

/** An mdast node for a definition list, rendered as a `<dl>` element. */
export interface DefinitionList extends Parent {
  type: "defList";
  children: Array<DefinitionTerm | DefinitionDescription>;
  data?: { attrsRole?: string; hName?: string; hProperties?: Properties };
}

/** An mdast node for a definition term, rendered as a `<dt>` element. */
export interface DefinitionTerm extends Parent {
  type: "defListTerm";
  data?: {
    hName?: string;
    attrsRole?: string;
    attrsTitle?: PhrasingContent[];
    hProperties?: Properties;
  };
}

/** An mdast node for a definition description, rendered as a `<dd>` element. */
export interface DefinitionDescription extends Parent {
  type: "defListDescription";
  spread: boolean;
  data?: { hName?: string; hProperties?: Properties };
}

export const clonePoint = <T extends object>(p: T): T => ({ ...p });

export type FlowToken = Token & {
  _tokenizer?: {
    events: Array<[string, Token, unknown]>;
  };
  previous?: Token;
  next?: Token;
};
