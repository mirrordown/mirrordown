import type { PluginWithOptions } from "markdown-it";
import type StateCore from "markdown-it/lib/rules_core/state_core.mjs";
import type Token from "markdown-it/lib/token.mjs";
import { scanTags, tagHref, type TagsOptions } from "@mirrordown/core";

export type { TagsOptions };

// Until `text_join`, which runs after this rule, an escaped character or a character reference is a `text_special` token of its own, inside the run of text around it.
const isText = (token: Token): boolean =>
  token.type === `text` || token.type === `text_special`;

// What can come before a run of text so that a `#` at its start opens a tag: nothing (the run starts the inline content), an opening token (the run starts an element's content: emphasis, a highlight), or a line break.
const opens = (before: Token | undefined): boolean =>
  before === undefined ||
  before.nesting === 1 ||
  before.type === `softbreak` ||
  before.type === `hardbreak`;

// The token before `index` that is content. The alerts plugin has built its titles by the time this rule runs, each with its icon as the first token (marked `githubAlertIcon`); the icon is decoration, so a tag that starts a title (`> [!NOTE] #tag`) still starts its content, as it does in remark and Sätteri, where tags are read before the icon is there.
const contentBefore = (
  children: readonly Token[],
  index: number
): Token | undefined => {
  const before = children[index - 1];
  return before?.meta?.githubAlertIcon === true ? undefined : before;
};

/**
 * markdown-it plugin for tags (`#tag`), rendering each as `<a class="tag" href="#tag">#tag</a>`. What a tag is and where one may start are shared with the remark and Sätteri plugins through `@mirrordown/core`. It is a core rule after `linkify`, so the attrs plugin has taken its blocks first, and a URL linkify found is a link a tag is never read in.
 */
export const tags: PluginWithOptions<TagsOptions> = (md, options) => {
  const href = tagHref(options);

  md.core.ruler.after(`linkify`, `tags`, (state: StateCore) => {
    for (const block of state.tokens) {
      if (block.type !== `inline` || !block.children) continue;
      const children = block.children;
      const out: Token[] = [];
      let changed = false;
      // How many links the token is inside: a tag is never read in a link's text.
      let links = 0;
      let index = 0;
      while (index < children.length) {
        const token = children[index];
        /* v8 ignore next */
        if (!token) break;
        if (token.type === `link_open`) links++;
        if (token.type === `link_close`) links--;
        if (links > 0 || !isText(token)) {
          out.push(token);
          index++;
          continue;
        }
        let end = index;
        let value = ``;
        const escaped = new Set<number>();
        for (
          let next = children[end];
          next !== undefined && isText(next);
          next = children[end]
        ) {
          if (next.type === `text_special`) {
            for (let i = 0; i < next.content.length; i++) {
              escaped.add(value.length + i);
            }
          }
          value += next.content;
          end++;
        }
        const run = children.slice(index, end);
        const parts = value.includes(`#`)
          ? scanTags(value, escaped, opens(contentBefore(children, index)))
          : undefined;
        index = end;
        if (!parts) {
          out.push(...run);
          continue;
        }
        changed = true;
        // The run's tokens over `from` to `to` of its text. A piece of a `text_special` token stays one, so the typographer, which runs later, still leaves an escaped character alone.
        // The pieces are asked for in order, so the run is walked once: `at` is the token the next piece starts in and `base` where that token starts in the run's text. Starting from the first token for every piece took seconds on a paragraph of thousands of tags and character references.
        let at = 0;
        let base = 0;
        const pushText = (from: number, to: number): void => {
          for (let child = run[at]; child !== undefined; child = run[at]) {
            const end = base + child.content.length;
            const start = Math.max(from, base);
            const stop = Math.min(to, end);
            if (start < stop) {
              const text = new state.Token(child.type, ``, 0);
              text.content = child.content.slice(start - base, stop - base);
              text.info = child.info;
              text.markup = child.markup;
              out.push(text);
            }
            // A token that goes on past this piece holds the start of the next one.
            if (end > to) return;
            at++;
            base = end;
          }
        };
        let offset = 0;
        for (const part of parts) {
          if (`text` in part) {
            pushText(offset, offset + part.text.length);
            offset += part.text.length;
            continue;
          }
          const open = new state.Token(`link_open`, `a`, 1);
          open.attrs = [
            [`class`, `tag`],
            [`href`, href(part.tag)]
          ];
          out.push(open);
          pushText(offset, offset + part.tag.length + 1);
          out.push(new state.Token(`link_close`, `a`, -1));
          offset += part.tag.length + 1;
        }
      }
      if (changed) block.children = out;
    }
  });
};
