// Token.meta is typed `any` by markdown-it; the reads below check its shape.
import type { PluginSimple } from "markdown-it";
import type StateCore from "markdown-it/lib/rules_core/state_core.mjs";
import type Token from "markdown-it/lib/token.mjs";
import {
  blankAfterMarker,
  cutMarker,
  resolveBlockIds,
  titleMarkerWritten,
  trailingMarker,
  trimBlankEnd
} from "@mirrordown/core";

const BREAKS = new Set([`softbreak`, `hardbreak`]);

// Containers whose content a marker inside doesn't leave: a tab panel and a step's body (mdit-tabs' and mdit-steps' tokens). A quote around one isn't named from inside it.
const BOUNDARIES = new Set([`tab_panel_open`, `steps_body_open`]);

// Blocks whose paragraphs name them: a list item, and a definition's description, whose paragraph a tight list hides.
const ITEMS = new Set([`list_item_open`, `dd_open`]);

// Blocks a marker in its own paragraph after them can't name: raw HTML has no element to carry an id, and a container's title or label isn't a block of its own. Several are other plugins' token names, which `tests/block-ids/interop.test.ts` pins.
const NAMELESS = new Set([
  `html_block`,
  `front_matter`,
  `steps_title_open`,
  `tab_label_open`,
  `tabs_labels_open`,
  `tab_input`
]);

const metaOf = (token: Token | undefined, key: string): unknown => {
  const meta: unknown = token?.meta;
  return typeof meta === `object` && meta !== null && key in meta
    ? (meta as Record<string, unknown>)[key]
    : undefined;
};

// An alert's container and its title, which mdit-github-alerts marks. The title's `meta.githubAlertTitle` is its type's own title.
const isAlert = (token: Token | undefined): boolean =>
  metaOf(token, `githubAlert`) === true;
const alertTitleOf = (token: Token | undefined): string | undefined => {
  const title = metaOf(token, `githubAlertTitle`);
  return typeof title === `string` ? title : undefined;
};

const isQuote = (token: Token | undefined): boolean =>
  token?.type === `blockquote_open` || isAlert(token);

const isTextual = (token: Token | undefined): token is Token =>
  token?.type === `text` || token?.type === `text_special`;

/**
 * markdown-it plugin for Obsidian's block identifiers: `^id` at the very end of a paragraph, a heading or an alert's title is removed, and the block it names gets the `id` `^id`, so a link to `#^id` reaches it. A marker names its paragraph or heading, the list item its paragraph is in, the outermost quote or alert around it, or, alone in its own paragraph, the block before that paragraph. It runs right after `linkify`, before `text_join`, so an escaped `^` (`\^id`) or a character reference is still a token of its own and stays text, and after mdit-attrs, so an id written with `{#name}` is the block's. Use it after mdit-github-alerts, whose title label it reads. Recognition is shared with the remark and Sätteri plugins through `@mirrordown/core`.
 */
export const blockIds: PluginSimple = (md) => {
  // A fence's language class is appended after the attributes it already has, so the slot is reserved before the id (see `nameBlock`) and its leading space dropped here: `class` then leads, as in remark and Sätteri.
  const renderFence = md.renderer.rules.fence;
  if (renderFence) {
    md.renderer.rules.fence = (tokens, idx, opts, env, self): string => {
      const html = renderFence(tokens, idx, opts, env, self);
      return metaOf(tokens[idx], `blockIdsReservedClass`) === true
        ? html.replace(` class=" `, ` class="`)
        : html;
    };
  }

  // markdown-it renders an indented code block's attributes on its `<pre>`; remark and Sätteri give an id to the `<code>`, as they do a fence's, so the id goes there.
  const renderCodeBlock = md.renderer.rules.code_block;
  if (renderCodeBlock) {
    md.renderer.rules.code_block = (tokens, idx, opts, env, self): string => {
      const html = renderCodeBlock(tokens, idx, opts, env, self);
      const id = metaOf(tokens[idx], `blockIdsCode`);
      return typeof id === `string`
        ? html.replace(`<code`, () => `<code id="${md.utils.escapeHtml(id)}"`)
        : html;
    };
  }

  // Give a block its id.
  const nameBlock = (block: Token, id: string): void => {
    if (block.type === `code_block`) {
      block.meta = { ...block.meta, blockIdsCode: id };
      return;
    }
    if (
      block.type === `fence` &&
      block.attrIndex(`class`) < 0 &&
      md.utils.unescapeAll(block.info).trim() !== ``
    ) {
      block.attrs = [[`class`, ``], ...(block.attrs ?? [])];
      block.meta = { ...block.meta, blockIdsReservedClass: true };
    }
    block.attrSet(`id`, id);
  };

  md.core.ruler.after(`linkify`, `block_ids`, (state: StateCore) => {
    if (!state.src.includes(`^`)) return;
    const { tokens } = state;

    // Each token's parent block and each closing token's opening one, by balancing them, as some plugins create tokens without setting their level.
    const parents: number[] = [];
    const opens = new Map<number, number>();
    const open: number[] = [];
    for (const [index, token] of tokens.entries()) {
      if (token.nesting === -1) {
        const start = open.pop();
        if (start !== undefined) opens.set(index, start);
      }
      parents[index] = open.at(-1) ?? -1;
      if (token.nesting === 1) open.push(index);
    }

    // The source lines a block's map indexes: the page's, or those of the tab panel or step body it was tokenized from (`meta.attrsSource`, the container plugins' convention that mdit-attrs and mdit-caption read too).
    const pageLines = state.src.split(`\n`);
    const ownLines = new Map<string, string[]>();
    const linesOf = (index: number): string[] => {
      for (let i = parents[index] ?? -1; i >= 0; i = parents[i] ?? -1) {
        const own = metaOf(tokens[i], `attrsSource`);
        if (typeof own !== `string`) continue;
        let lines = ownLines.get(own);
        if (!lines) ownLines.set(own, (lines = own.split(`\n`)));
        return lines;
      }
      return pageLines;
    };

    // Paragraphs a marker emptied, each with what a marker after it in its own paragraph names in its place.
    const removed = new Map<Token, Token | undefined>();
    const namings: Array<{ element: Token; id: string }> = [];

    // The block before the paragraph opened at `index` that a marker in its own paragraph names, if any.
    const previousBlock = (index: number): Token | undefined => {
      const before = tokens[index - 1];
      if (!before || before.nesting === 1) return undefined;
      const start = before.nesting === -1 ? opens.get(index - 1) : index - 1;
      const block = start === undefined ? undefined : tokens[start];
      if (!block) return undefined;
      if (removed.has(block)) return removed.get(block);
      return NAMELESS.has(block.type) || alertTitleOf(block) !== undefined
        ? undefined
        : block;
    };

    // The outermost quote or alert around the block opened at `index`, up to the tab panel or step body it is in.
    const outerQuote = (index: number): Token | undefined => {
      let quote: Token | undefined;
      for (
        let i = parents[index] ?? -1;
        i >= 0 && !BOUNDARIES.has(tokens[i]!.type);
        i = parents[i] ?? -1
      )
        if (isQuote(tokens[i])) quote = tokens[i];
      return quote;
    };

    for (const [index, block] of tokens.entries()) {
      const title = block.nesting === 1 && alertTitleOf(block) !== undefined;
      if (
        block.type !== `paragraph_open` &&
        block.type !== `heading_open` &&
        !title
      )
        continue;
      const inline = tokens[index + 1];
      const children = inline?.type === `inline` ? inline.children : null;
      if (!children) continue;
      const at = children.length - 1;
      const last = children[at];
      if (last?.type !== `text`) continue;
      const previous = children[at - 1];
      // What comes before the text ends a line or a word: the start of the block (an alert's title starts after its `[!TYPE]`, and an icon), a break, or text ending in a space or tab.
      const separated =
        previous === undefined ||
        BREAKS.has(previous.type) ||
        (title &&
          children
            .slice(0, at)
            .every((child) => metaOf(child, `githubAlertIcon`) === true)) ||
        (isTextual(previous) &&
          trimBlankEnd(previous.content) !== previous.content);
      // An escape or a character reference is a `text_special` token until `text_join`, so the marker in one text token is written as plain text.
      const marker = trailingMarker(last.content, separated);
      if (!marker) continue;
      const { id, start } = marker;

      const parent = parents[index] ?? -1;
      const container = tokens[parent];
      const lines = linesOf(index);
      const map = block.map;
      if (title) {
        // An alert's title is its first line. It ends with the marker only when nothing followed on the lines of its paragraph: then the alert's body doesn't start on that line.
        const line = container?.map?.[0];
        if (line !== undefined) {
          const next = tokens[index + 3];
          if (next?.type === `paragraph_open` && next.map?.[0] === line)
            continue;
          if (!titleMarkerWritten(lines[line], id)) continue;
        }
      } else if (map) {
        // The marker's line, counted in breaks from the block's start and from its end: each is right where the other can be off (a code span that spans lines hides a line ending; an attribute block on its own line may have been taken off the block's end). An alert's first paragraph starts on the alert's line, which its title took.
        const breaks = children.filter((child) =>
          BREAKS.has(child.type)
        ).length;
        const setext =
          block.type === `heading_open` && /^[=-]/.test(block.markup);
        const shared = isAlert(container) && container?.map?.[0] === map[0];
        const written = [
          map[0] + Number(shared) + breaks,
          block.type === `heading_open` && !setext
            ? map[0]
            : map[1] - 1 - Number(setext)
        ];
        if (written.some((line) => blankAfterMarker(lines[line], id))) continue;
      }

      // Cut the marker, and a break it stood after alone on its line, with the spaces left before them.
      const kept = cutMarker(last.content, start);
      const content = children.slice(0, at);
      if (kept !== ``) {
        last.content = kept;
        content.push(last);
      } else if (start === 0 && previous && BREAKS.has(previous.type))
        content.pop();
      for (let tail = content.at(-1); isTextual(tail); tail = content.at(-1)) {
        const trimmed = trimBlankEnd(tail.content);
        if (trimmed === tail.content) break;
        if (trimmed === ``) content.pop();
        else tail.content = trimmed;
      }

      if (title) {
        // A title left empty is the type's own, as the alert gives a title with no text; its label is its text now, whether or not mdit-github-alerts' label rule runs after this one.
        const fallback = alertTitleOf(block) ?? ``;
        if (
          content.every((child) => metaOf(child, `githubAlertIcon`) === true)
        ) {
          const text = new state.Token(`text`, ``, 0);
          text.content = fallback;
          content.push(text);
        }
        const label = block.attrGet(`aria-label`);
        if (label !== null) {
          const marked = trimBlankEnd(label);
          const stripped = marked.endsWith(`^${id}`)
            ? marked.slice(0, -id.length - 1).trim()
            : label;
          block.attrSet(`aria-label`, stripped || fallback);
        }
      }
      inline!.children = content;

      const alone = block.type === `paragraph_open` && content.length === 0;
      const quote = outerQuote(index);
      let target: Token | undefined;
      if (quote) target = quote;
      else if (
        block.type === `paragraph_open` &&
        ITEMS.has(container?.type ?? ``)
      )
        target = container;
      else if (!alone) target = block;
      else target = previousBlock(index);
      if (alone) removed.set(block, target);
      // The id holds the `^`: it is the fragment Obsidian writes, and no heading's slug has one.
      if (target && !target.attrGet(`id`))
        namings.push({ element: target, id: `^${id}` });
    }

    for (const [element, id] of resolveBlockIds(namings))
      nameBlock(element, id);
    if (removed.size === 0) return;
    // A paragraph a marker emptied goes, with its inline and closing tokens.
    const dropped = new Set<Token>();
    for (const [index, token] of tokens.entries()) {
      if (!removed.has(token)) continue;
      dropped
        .add(token)
        .add(tokens[index + 1]!)
        .add(tokens[index + 2]!);
    }
    state.tokens = tokens.filter((token) => !dropped.has(token));
  });
};
