// Copy buttons for code blocks, shared by the markdown-it, rehype and Sätteri plugins: which blocks get one, the id their `<pre>` takes, and the button's markup. The button goes in the `<pre>`, after its `<code>`, as a `--copy` invoker command aimed at the `<pre>`; the plugins' client script does the copying and shows the button.

import type { HastLike } from "./hast.js";
import { mermaidIdPrefixes } from "./mermaid-pele.js";

/** The copy button's class. */
export const COPY_CODE_CLASS = "markdown-copy-code";

/** The invoker command the button sends its code block. */
export const COPY_CODE_COMMAND = "--copy";

// The word in a fence's meta (```sh nocopy) that leaves its block without a button.
const OPT_OUT = `nocopy`;

/** Whether a fence's meta, the info string after its language, turns its block's button off. */
export const copyCodeOptedOut = (meta: string | null | undefined): boolean =>
  (meta ?? ``).split(/\s+/).includes(OPT_OUT);

/** The text a block copies: its code with line endings normalized and without the newline that ends it. */
export const copyCodeText = (code: string): string =>
  code.replace(/\r\n?/g, `\n`).replace(/\n$/, ``);

/**
 * A document's code block ids, one per block in document order: `code-` and a hash of the block's text, so a block's id doesn't change when others are edited, with `-2`, `-3`… for repeats of one block. Create one per document.
 */
export const copyCodeIds = (): ((text: string) => string) =>
  mermaidIdPrefixes(`code`);

type CodeLike = HastLike & { data?: { meta?: unknown } };

const textOf = (node: HastLike): string =>
  node.type === `text`
    ? (node.value ?? ``)
    : (node.children ?? []).map(textOf).join(``);

/**
 * A hast `<pre>` holding a code block, as markdown renders one: its only element child is a `<code>`. Returns the text the block copies and its fence's meta, or nothing for another `<pre>` or an empty block. The meta is the `<code>`'s, as remark and Sätteri keep it, or else the `<pre>`'s `data-meta` attribute, where a highlighter that rebuilds the block (such as Astro's Shiki) can keep it.
 */
export const copyCodeBlock = (
  node: HastLike
): { text: string; meta: string | undefined } | undefined => {
  if (node.type !== `element` || node.tagName !== `pre`) return undefined;
  const elements = (node.children ?? []).filter(
    (child) => child.type === `element`
  );
  const [code] = elements;
  if (elements.length !== 1 || code?.tagName !== `code`) return undefined;
  const text = copyCodeText(textOf(code));
  if (text === ``) return undefined;
  const meta = (code as CodeLike).data?.meta ?? node.properties?.dataMeta;
  return { text, meta: typeof meta === `string` ? meta : undefined };
};

// Lucide's copy and check icons (lucide.dev, ISC): the button shows the check once its block is copied.
const icon = (name: string, paths: string): string =>
  `<svg class="${COPY_CODE_CLASS}-icon" data-icon="${name}" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const COPY_ICON = icon(
  `copy`,
  `<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>`
);
const CHECK_ICON = icon(`check`, `<path d="M20 6 9 17l-5-5"></path>`);

/**
 * The copy button for the code block whose `<pre>` has the id, to go in the `<pre>` after its `<code>`. It starts `hidden`: the client script shows it where it can copy, so a page without the script has no button that does nothing.
 */
export const copyCodeButton = (id: string): string =>
  `<button type="button" class="${COPY_CODE_CLASS}" command="${COPY_CODE_COMMAND}" commandfor="${id}" aria-label="Copy code" hidden>${COPY_ICON}${CHECK_ICON}</button>`;
