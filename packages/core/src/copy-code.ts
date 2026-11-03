// Copy buttons for code blocks, shared by the markdown-it, rehype and Sätteri plugins: which blocks get one, the id their `<pre>` takes, and the button's markup under the plugins' options. The button goes in the `<pre>`, after its `<code>`, as a `--copy` invoker command aimed at the `<pre>`; the plugins' client script does the copying and shows the button.

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

/** A copy button's states: before its block is copied, and for a moment after. */
export type CopyCodeState = "copy" | "copied";

/** Options shared by the copy-code plugins for every engine. */
export interface CopyCodeOptions {
  /** The button's icon in each state, as SVG markup. An icon can be replaced but not removed, since it's all the button holds: an empty one keeps the default. Defaults: {@link COPY_CODE_ICONS}. */
  icons?: Partial<Record<CopyCodeState, string>>;
  /**
   * Text shown beside the button in each state, and the button's accessible name; `null` or `""` shows none. Defaults: {@link COPY_CODE_TEXT}, `Copy code` before copying and `Copied!` after. The copy text shows while the button is hovered or focused, as its tooltip.
   */
  text?: Partial<Record<CopyCodeState, string | null>>;
}

// Lucide's copy and check icons (lucide.dev, ISC).
const icon = (paths: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

/** The button's default icon in each state. */
export const COPY_CODE_ICONS: Record<CopyCodeState, string> = {
  copy: icon(
    `<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>`
  ),
  copied: icon(`<path d="M20 6 9 17l-5-5"></path>`)
};

/** The button's default text in each state: `Copy code` before copying, as its tooltip, and `Copied!` after, as GitHub shows it. */
export const COPY_CODE_TEXT: Record<CopyCodeState, string> = {
  copy: `Copy code`,
  copied: `Copied!`
};

// Its accessible name while it has no copy text.
const DEFAULT_LABEL = `Copy code`;

const escape = (value: string): string =>
  value.replace(/&/g, `&amp;`).replace(/</g, `&lt;`).replace(/"/g, `&quot;`);

/**
 * Builds a document's copy buttons under the plugin's options. A button is for the code block whose `<pre>` has the id, and goes in the `<pre>` after its `<code>`. It starts `hidden`: the client script shows it where it can copy, so a page without the script has no button that does nothing. Each state's icon and text are spans marked `data-state`, which the stylesheet shows by the button's `data-copied`; the client script names the copied button by its copied text.
 */
export const createCopyCodeButton = (
  options: CopyCodeOptions = {}
): ((id: string) => string) => {
  const icons = { ...COPY_CODE_ICONS, ...options.icons };
  const texts = { ...COPY_CODE_TEXT, ...options.text };
  // `null` shows no text, as `""` does.
  const text = (state: CopyCodeState): string => texts[state] ?? ``;
  const states: CopyCodeState[] = [`copy`, `copied`];
  const content = [
    // An empty icon keeps the default, so the button is never empty.
    ...states.map(
      (state) =>
        `<span class="${COPY_CODE_CLASS}-icon" data-state="${state}" aria-hidden="true">${icons[state] || COPY_CODE_ICONS[state]}</span>`
    ),
    ...states.map((state) =>
      text(state)
        ? `<span class="${COPY_CODE_CLASS}-text" data-state="${state}" aria-hidden="true">${escape(text(state))}</span>`
        : ``
    )
  ].join(``);
  const label = escape(text(`copy`) || DEFAULT_LABEL);
  return (id) =>
    `<button type="button" class="${COPY_CODE_CLASS}" command="${COPY_CODE_COMMAND}" commandfor="${id}" aria-label="${label}" hidden>${content}</button>`;
};
