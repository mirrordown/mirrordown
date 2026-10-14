import type { Plugin } from "unified";
import type { Data, Nodes, Parent, PhrasingContent, Root } from "mdast";
import type {
  CompileContext,
  Extension as FromMarkdownExtension,
  Token
} from "mdast-util-from-markdown";
import { scriptSyntax } from "@mirrordown/core";

/** Optional data carried by a {@link Superscript} node. */
export interface SuperscriptData extends Data {}

/** An mdast node for `^superscript^` text, rendered as a `<sup>` element. */
export interface Superscript extends Parent {
  type: `superscript`;
  children: PhrasingContent[];
  data?: SuperscriptData | undefined;
}

/** mdast-util-from-markdown extension turning `superscript` tokens into {@link Superscript} nodes. */
export const superscriptFromMarkdown: FromMarkdownExtension = {
  canContainEols: [`superscript`],
  enter: {
    superscript(this: CompileContext, token: Token) {
      const node: Superscript = {
        type: `superscript`,
        children: [],
        data: { hName: `sup` }
      };
      // The JSR build has no mdast augmentation, so `Superscript` is not in `Nodes` there.
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion, typescript/no-unnecessary-type-assertion
      this.enter(node as unknown as Nodes, token);
    }
  },
  exit: {
    superscript(this: CompileContext, token: Token) {
      this.exit(token);
    }
  }
};

/**
 * remark plugin for superscript syntax (`^text^`), parsed as a {@link Superscript} node that renders as a `<sup>` element. A single `^` is a delimiter run like emphasis, and its content is inline markup; it shares its syntax with `remd-sub` through `@mirrordown/core`, so the two nest and resolve crossing runs leftmost-first.
 */
export const remarkSup: Plugin<[], Root> = function () {
  // this.data() in remark plugin context returns a generic shape; the cast narrows the known extension arrays.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const data = this.data() as {
    micromarkExtensions?: unknown[];
    fromMarkdownExtensions?: unknown[];
  };
  (data.micromarkExtensions ??= []).push(scriptSyntax(`^`));
  (data.fromMarkdownExtensions ??= []).push(superscriptFromMarkdown);
};
