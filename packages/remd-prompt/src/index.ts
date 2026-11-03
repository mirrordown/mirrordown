// The plugins bridge the processor's untyped parse, the prompt's custom mdast nodes and hast's `raw` nodes, which mdast and hast's types don't hold; the assertions are reviewed and intentional.
/* oxlint-disable typescript/no-unsafe-type-assertion */
import type { Element, ElementContent, Root } from "hast";
import type { Code, Root as MdastRoot, RootContent } from "mdast";
import type { Plugin } from "unified";
import { SKIP, visit } from "unist-util-visit";
import {
  createPrompt,
  placePromptPositions,
  PROMPT_CLASS,
  PROMPT_DEFAULT_SERVICES,
  PROMPT_LANGUAGE,
  PROMPT_NODE,
  PROMPT_PREVIEW_CLASS,
  PROMPT_PREVIEW_NODE,
  PROMPT_SERVICES,
  PROMPT_TEXT,
  promptBlock,
  promptIds,
  type PromptOptions,
  type PromptService,
  type PromptTextKey
} from "@mirrordown/core/prompt";

export type { PromptOptions, PromptService, PromptTextKey };
export { PROMPT_DEFAULT_SERVICES, PROMPT_SERVICES, PROMPT_TEXT };

// The nodes a prompt's code block and its parsed preview wait in, for rehypePrompt: <div>s once remark-rehype converts them.
interface PromptNode {
  type: string;
  data: { hName: string; hProperties: { className: string[] } };
  children: RootContent[];
}

const div = (
  type: string,
  className: string,
  children: RootContent[]
): RootContent =>
  ({
    type,
    data: { hName: `div`, hProperties: { className: [className] } },
    children
  }) satisfies PromptNode as unknown as RootContent;

/**
 * remark plugin that parses each ` ```prompt ` fence's text with the page's own processor, for its preview: the prompt's code block and the parsed markdown wait in a `prompt` node, which `rehypePrompt` turns into the prompt. Register it before the remark plugins whose syntax a preview should show, as they treat the preview as the page; a prompt inside a prompt stays a code block. Its nodes keep their places in the document's source, so plugins that read the source find them.
 */
export const remarkPrompt: Plugin<[], MdastRoot> = function () {
  // oxlint-disable-next-line typescript/no-this-alias -- the transformer parses with the processor the plugin is attached to.
  const processor = this;
  return (tree, file) => {
    const source = typeof file.value === `string` ? file.value : undefined;
    visit(tree, `code`, (node: Code, index, parent) => {
      if (
        node.lang !== PROMPT_LANGUAGE ||
        node.value.trim() === `` ||
        !parent ||
        index === undefined
      )
        return;
      let preview: RootContent[];
      try {
        preview = (processor.parse(node.value) as MdastRoot).children;
        placePromptPositions(
          preview,
          node.value,
          source,
          node.position?.start.line
        );
      } catch {
        // Text the page's syntax can't take (MDX reads `{` and `<` as code) is the preview's text as it is.
        preview = [
          { type: `paragraph`, children: [{ type: `text`, value: node.value }] }
        ];
      }
      parent.children[index] = div(PROMPT_NODE, PROMPT_CLASS, [
        node,
        div(PROMPT_PREVIEW_NODE, PROMPT_PREVIEW_CLASS, preview)
      ]);
      return [SKIP, index + 1];
    });
  };
};

// Raw HTML in place of nodes, as remd-file-tree writes its trees: the prompt reaches the HTML byte-for-byte (as in mdit-prompt), and hast's types have no `raw` node without mdast-util-to-hast's augmentation.
const raw = (value: string): ElementContent =>
  ({ type: `raw`, value }) as unknown as ElementContent;

const isWrapper = (node: Element): boolean => {
  const className = node.properties.className;
  return (
    node.tagName === `div` &&
    Array.isArray(className) &&
    className.length === 1 &&
    className[0] === PROMPT_CLASS
  );
};

/**
 * rehype plugin that renders the prompts `remarkPrompt` found as prompts for readers to hand to an AI: a `<div class="markdown-prompt">` holding a `<details>`, closed unless the fence's meta says `open`, whose `<summary>` is the prompt's title (`title="…"`), followed by a copy button and a button for each service the meta names (`claude`, `chatgpt`, `cursor`…, or the defaults). Opened, it shows the prompt's preview, which the page's plugins rendered with the rest of the page, and its markdown a click away. A service that takes the prompt in its URL gets it through a GET form, so the prompt is in no link an agent reads; others open for the reader to paste it. The prompt reads as a code block where the plugins aren't installed. A prompt a highlighter already built (Astro's Shiki, with `prompt` aliased to `markdown`) keeps its highlighting in the markdown view. The prompt's own markup is `raw` nodes, so it reaches the HTML exactly as the markdown-it and Sätteri plugins write it (stringify with `allowDangerousHtml`); attributes on the fence (`{#id .class}`, with remark-attrs) go on the `<div>`. Register it before copy-code. The client script (`@mirrordown/remd-prompt/client`) copies. The markup is shared with the markdown-it and Sätteri plugins through `@mirrordown/core`.
 */
export const rehypePrompt: Plugin<[PromptOptions?], Root> = (options = {}) => {
  const render = createPrompt(options);
  return (tree) => {
    const ids = promptIds();
    visit(tree, `element`, (node, index, parent) => {
      if (!isWrapper(node) || !parent || index === undefined) return;
      const [pre, preview] = node.children;
      const block = pre && promptBlock(pre);
      const markup = block && render(block, ids);
      if (!markup || !preview) return;
      parent.children.splice(
        index,
        1,
        raw(markup.open),
        preview,
        raw(markup.close)
      );
      return index + 3;
    });
  };
};
