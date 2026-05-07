import type {
  CompileContext,
  Extension as FromMarkdownExtension,
  Handle,
} from "mdast-util-from-markdown";
import type { PhrasingContent } from "mdast";
import type { Token } from "micromark-util-types";
import type { DefinitionDescription, DefinitionList, DefinitionTerm, FlowToken } from "./types.js";

function enterDefList(this: CompileContext, token: Token): void {
  this.enter({ type: "defList", children: [], data: { attrsRole: "container" } } as unknown as DefinitionList, token);
}

function exitDefList(this: CompileContext, token: Token): void {
  this.exit(token);
}

function enterDefListTerm(this: CompileContext, token: Token): void {
  const node = { type: "defListTerm", children: [] } as unknown as DefinitionTerm;
  this.enter(node, token);
}

function exitDefListTerm(this: CompileContext, token: Token): void {
  const node = this.stack[this.stack.length - 1] as unknown as DefinitionTerm;
  node.data = { attrsRole: "containerItem", attrsTitle: node.children as PhrasingContent[] };
  this.exit(token);
}

function enterDefListDescription(this: CompileContext, token: Token): void {
  this.enter(
    {
      type: "defListDescription",
      spread: Boolean((token as FlowToken)._loose),
      children: [],
    } as unknown as DefinitionDescription,
    token,
  );
}

function exitDefListDescription(this: CompileContext, token: Token): void {
  this.exit(token);
}

export const defListFromMarkdown: FromMarkdownExtension = {
  enter: {
    defList: enterDefList as Handle,
    defListTerm: enterDefListTerm as Handle,
    defListDescription: enterDefListDescription as Handle,
  },
  exit: {
    defList: exitDefList as Handle,
    defListTerm: exitDefListTerm as Handle,
    defListDescription: exitDefListDescription as Handle,
  },
};
