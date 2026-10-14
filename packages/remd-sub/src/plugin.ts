import type { Plugin } from "unified";
import type { Data, Nodes, Parent, PhrasingContent, Root } from "mdast";
import type {
  CompileContext,
  Extension as FromMarkdownExtension,
  Token
} from "mdast-util-from-markdown";
import { scriptSyntax } from "@mirrordown/core";

/** Optional data carried by a {@link Subscript} node. */
export interface SubscriptData extends Data {}

/** An mdast node for `~subscript~` text, rendered as a `<sub>` element. */
export interface Subscript extends Parent {
  type: `subscript`;
  children: PhrasingContent[];
  data?: SubscriptData | undefined;
}

/** mdast-util-from-markdown extension turning `subscript` tokens into {@link Subscript} nodes. */
export const subscriptFromMarkdown: FromMarkdownExtension = {
  canContainEols: [`subscript`],
  enter: {
    subscript(this: CompileContext, token: Token) {
      const node: Subscript = {
        type: `subscript`,
        children: [],
        data: { hName: `sub` }
      };
      // The JSR build has no mdast augmentation, so `Subscript` is not in `Nodes` there.
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion, typescript/no-unnecessary-type-assertion
      this.enter(node as unknown as Nodes, token);
    }
  },
  exit: {
    subscript(this: CompileContext, token: Token) {
      this.exit(token);
    }
  }
};

/**
 * remark plugin for subscript syntax (`~text~`), parsed as a {@link Subscript} node that renders as a `<sub>` element. A single `~` is a delimiter run like emphasis, and its content is inline markup; it shares its syntax with `remd-sup` through `@mirrordown/core`, so the two nest and resolve crossing runs leftmost-first. Use `remark-gfm` with `singleTilde: false`, or GFM claims `~text~` as strikethrough first.
 */
export const remarkSub: Plugin<[], Root> = function () {
  // this.data() in remark plugin context returns a generic shape; the cast narrows the known extension arrays.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const data = this.data() as {
    micromarkExtensions?: unknown[];
    fromMarkdownExtensions?: unknown[];
  };
  (data.micromarkExtensions ??= []).push(scriptSyntax(`~`));
  (data.fromMarkdownExtensions ??= []).push(subscriptFromMarkdown);
};
