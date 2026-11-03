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
import {
  defineHastPlugin,
  defineMdastPlugin,
  markdownToMdast,
  type HastVisitorInstance,
  type MdastPluginInstance,
  type PluginFactoryContext
} from "satteri";

export type { PromptOptions, PromptService, PromptTextKey };
export { PROMPT_DEFAULT_SERVICES, PROMPT_SERVICES, PROMPT_TEXT };

type CodeVisitor = NonNullable<MdastPluginInstance["code"]>;
type ElementVisitor = Extract<
  NonNullable<HastVisitorInstance["element"]>,
  { filter: string[] }
>;

/**
 * The preview plugin's definition: only the keys it defines, with a synchronous visitor, so `markdownToHtml` returns its result directly.
 */
export interface PromptPreviewPlugin {
  name: string;
  options: { position: boolean };
  code: (...args: Parameters<CodeVisitor>) => void;
}

/**
 * The plugin's definition: only the keys it defines, with a synchronous visitor, so `markdownToHtml` returns its result directly.
 */
export interface PromptPlugin {
  name: string;
  element: {
    filter: string[];
    visit: (...args: Parameters<ElementVisitor["visit"]>) => void;
  };
}

/**
 * Sätteri mdast plugin that parses each ` ```prompt ` fence's text with the document's features, for its preview: the prompt's code block and the parsed markdown wait in a `prompt` node, which {@link satteriPrompt} turns into the prompt. List it first in `mdastPlugins`, as the plugins after it treat the preview as the page; a prompt inside a prompt stays a code block. Its nodes keep their places in the document's source, so plugins that read the source find them.
 */
export const satteriPromptPreview =
  (): ((ctx: PluginFactoryContext) => PromptPreviewPlugin) =>
  ({ features }) =>
    defineMdastPlugin({
      name: `prompt-preview`,
      options: { position: true },
      code(node, ctx) {
        if (node.lang !== PROMPT_LANGUAGE || node.value.trim() === ``) return;
        // The document's syntax, but not its frontmatter: a prompt can start with a `---` line.
        const preview = markdownToMdast(node.value, {
          features: { ...features, frontmatter: false }
        }).children;
        placePromptPositions(
          preview,
          node.value,
          ctx.source,
          node.position?.start.line
        );
        ctx.replaceNode(node, {
          type: PROMPT_NODE,
          data: { hName: `div`, hProperties: { className: [PROMPT_CLASS] } },
          children: [
            node,
            {
              type: PROMPT_PREVIEW_NODE,
              data: {
                hName: `div`,
                hProperties: { className: [PROMPT_PREVIEW_CLASS] }
              },
              children: preview
            }
          ]
        });
      }
    });

const isWrapper = (className: unknown): boolean =>
  Array.isArray(className) &&
  className.length === 1 &&
  className[0] === PROMPT_CLASS;

/**
 * Sätteri hast plugin that renders the prompts {@link satteriPromptPreview} found as prompts for readers to hand to an AI: a `<div class="markdown-prompt">` holding a `<details>`, closed unless the fence's meta says `open`, whose `<summary>` is the prompt's title (`title="…"`), followed by a copy button and a button for each service the meta names (`claude`, `chatgpt`, `cursor`…, or the defaults). Opened, it shows the prompt's preview, which the document's plugins rendered with the rest of the page, and its markdown a click away. A service that takes the prompt in its URL gets it through a GET form, so the prompt is in no link an agent reads; others open for the reader to paste it. The prompt reads as a code block where the plugins aren't installed. A prompt a highlighter already built (Astro's Shiki, with `prompt` aliased to `markdown`) keeps its highlighting in the markdown view. The prompt's own markup is `raw` nodes, so it reaches the HTML exactly as the markdown-it and rehype plugins write it; attributes on the fence (`{#id .class}`, with the `attributes` feature) go on the `<div>`. List it before copy-code. The client script (`@mirrordown/sat-prompt/client`) copies. The markup is shared with the markdown-it and rehype plugins through `@mirrordown/core`.
 */
export const satteriPrompt = (
  options: PromptOptions = {}
): ((ctx: PluginFactoryContext) => PromptPlugin) => {
  const render = createPrompt(options);
  return () => {
    const ids = promptIds();
    return defineHastPlugin({
      name: `prompt`,
      element: {
        filter: [`div`],
        visit(node, ctx) {
          if (!isWrapper(node.properties.className)) return;
          const [pre, preview] = node.children;
          const block = pre && promptBlock(pre);
          const markup = block && render(block, ids);
          if (!markup || !preview) return;
          ctx.replaceNode(node, [
            { type: `raw`, value: markup.open },
            preview,
            { type: `raw`, value: markup.close }
          ]);
        }
      }
    });
  };
};
