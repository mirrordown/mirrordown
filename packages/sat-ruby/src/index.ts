import {
  defineMdastPlugin,
  markdownToMdast,
  type Custom,
  type Features,
  type MdastPluginInstance,
  type MdastTarget,
  type PluginFactoryContext
} from "satteri";
import {
  addProperties,
  carryEscapes,
  claimTrailingAttributes,
  createAttributeReader,
  leadingAttributes,
  maskEscaped,
  textEscapes
} from "@mirrordown/core";

type TextVisitor = NonNullable<MdastPluginInstance["text"]>;
type BeforeHook = NonNullable<MdastPluginInstance["before"]>;

/** Options for the {@link satteriRuby} plugin. */
export interface RubyOptions {
  /** Fallback parenthesis characters emitted as `<rp>` for browsers without ruby support. */
  rp?: [string, string];
  /**
   * The features to parse a ruby's base and reading with, over the document's. They're parsed on their own, with the document's features unless these change them.
   */
  features?: Features;
}

/**
 * The plugin's definition: only the keys it defines, with synchronous visitors, so `markdownToHtml` returns its result directly.
 */
export interface RubyPlugin {
  name: string;
  options: { position: boolean };
  before: (...args: Parameters<BeforeHook>) => void;
  text: (...args: Parameters<TextVisitor>) => void;
}

/** A ruby found in the source: its range, and its raw base and reading. */
interface Span {
  start: number;
  end: number;
  base: string;
  reading: string;
}

// Blocks whose content is inline: the scope a ruby is found and re-parsed in.
const INLINE_BLOCKS = new Set([
  `paragraph`,
  `heading`,
  `tableCell`,
  `descriptionTerm`
]);
// Nodes whose source is not inline content: a ruby inside them is left alone (an image label is alt text, which stays verbatim).
const OPAQUE = new Set([`inlineCode`, `inlineMath`, `html`, `image`]);
// The grammar remd-ruby's tokenizer and mdit-ruby's rule share: `{`, a base (no `|`, `{`, `}` or line ending, though it may start with `{`), `|`, a reading (no `}` or line ending), `}`.
const RUBY = /^\{([^|}\r\n][^|{}\r\n]*)\|([^}\r\n]+)\}/;
const RUBY_IN_TEXT = /\{([^|}\r\n][^|{}\r\n]*)\|([^}\r\n]+)\}/g;
const MAYBE_RUBY = /\{[^|{}\r\n]+\|[^}\r\n]+\}/;
// A ruby's stand-in while its surroundings are re-parsed. The outer characters are punctuation, as the braces they replace are, so emphasis beside a ruby flanks the way it does in the other engines; the private-use characters inside keep the pair from matching anything an author would write.
const OPEN = `⸨${String.fromCharCode(0xe000)}`;
const CLOSE = `${String.fromCharCode(0xe001)}⸩`;
const PLACEHOLDER = new RegExp(`${OPEN}(\\d+)${CLOSE}`, `g`);
// What a base or a reading that would parse as an HTML block is given to start with while it is parsed.
const START = String.fromCharCode(0xe003);
// What a line after the first is indented by while a slice is re-parsed: four columns, where no block can open.
const CONTINUATION = `    `;
// What a slice that ends in an attribute block is given to end with while it is re-parsed, so the block stays the text it is in the document.
const END = String.fromCharCode(0xe002);
// Spaces and tabs around a base or a reading are not part of it, as a paragraph's are not; one that is nothing but whitespace is kept.
const tidy = (text: string): string =>
  text.replace(/^[ \t]+|[ \t]+$/g, ``) || text;
// In a GFM table cell, `\|` keeps its backslash in the base; it is dropped there, as remd-ruby does and as markdown-it's table rule does before its inline rules run. Anywhere else the backslash is the author's and stays.
const baseOf = (raw: string, inCell: boolean): string =>
  inCell ? raw.replace(/\\$/, ``) : raw;

/** The rubies in `source[from, to)`, skipping escaped `{` and the `skip` ranges. */
const findSpans = (
  source: string,
  from: number,
  to: number,
  skip: ReadonlyArray<readonly [number, number]>,
  inCell: boolean
): Span[] => {
  const spans: Span[] = [];
  for (let i = from; i < to; i++) {
    if (source[i] !== `{`) continue;
    let slashes = 0;
    for (let j = i - 1; j >= from && source[j] === `\\`; j--) slashes++;
    if (slashes % 2) continue;
    if (skip.some(([start, end]) => i >= start && i < end)) continue;
    const match = RUBY.exec(source.slice(i, to));
    if (!match) continue;
    spans.push({
      start: i,
      end: i + match[0].length,
      base: baseOf(match[1] ?? ``, inCell),
      reading: match[2] ?? ``
    });
    i += match[0].length - 1;
  }
  return spans;
};

/**
 * Sätteri plugin for ruby annotation syntax (`{base|reading}`), rendering `<ruby>` elements with the same output as `@mirrordown/remd-ruby` and `@mirrordown/mdit-ruby`. `|` is a hard delimiter: the base and the reading are parsed as separate inline content, so no construct straddles them. Sätteri parses before plugins run, so the plugin finds rubies in each block's source and re-parses the content around them with each ruby held as a placeholder. List it before plugins that build nodes over the same text (the preset does), since nodes without a source position can't be re-read.
 */
export const satteriRuby =
  (options: RubyOptions = {}): ((ctx: PluginFactoryContext) => RubyPlugin) =>
  ({ source, features }) => {
    const { rp } = options;
    // Sätteri reads attribute blocks before plugins run, when the document's features turn them on: a block written right after a ruby is then the ruby's to take.
    const read =
      features.attributes === true
        ? createAttributeReader(markdownToMdast)
        : undefined;
    const parse = {
      features: { ...features, ...options.features, frontmatter: false }
    };
    // The children of `text` parsed on its own, with the document's features.
    const parseChildren = (text: string): readonly MdastTarget[] => {
      const root = markdownToMdast(text, parse);
      return `children` in root ? root.children : [];
    };
    // A copy of `node` with new children. Typed through `Custom`, which takes any node type: re-checking the spread against the original node's own type would reject children of other kinds.
    const withChildren = (node: MdastTarget, children: MdastTarget[]): Custom =>
      // Some node types declare `position?: Position | undefined`, which `Custom`'s exact optional `position` rejects though the value is the same; listing fields instead would drop node-specific ones such as a link's `url`.
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      ({ ...node, children }) as Custom;
    // The text nodes of a re-parsed fragment hold offsets into that fragment (`parsed`), which a plugin that runs later would read as offsets into the document. Each is rebuilt without a position, in pieces around the `pattern` matches that `swap` turns into nodes, and every piece keeps a record of its escaped characters instead, so a span scan that runs later still tells `\==` from `==`. A match `swap` declines stays text. A node `swap` built takes the attribute blocks the text goes on with, unless their `{` is escaped.
    const rebuild = (
      nodes: readonly MdastTarget[],
      parsed: string,
      inCell: boolean,
      pattern?: RegExp,
      swap?: (
        match: RegExpExecArray,
        escaped: Set<number>
      ) => MdastTarget | undefined,
      skip?: ReadonlySet<string>,
      parentType?: string
    ): MdastTarget[] =>
      nodes.flatMap((node): MdastTarget[] => {
        if (node.type === `text` && typeof node.value === `string`) {
          const { value } = node;
          const escaped = textEscapes(
            node,
            parsed,
            parentType,
            nodes.length === 1,
            inCell
          );
          const out: MdastTarget[] = [];
          let last = 0;
          const piece = (to: number): void => {
            if (to <= last) return;
            const text = {
              type: `text` as const,
              value: value.slice(last, to)
            };
            carryEscapes(text, escaped, last);
            out.push(text);
          };
          for (const match of pattern ? value.matchAll(pattern) : []) {
            const swapped = swap?.(match, escaped);
            if (!swapped) continue;
            piece(match.index);
            out.push(swapped);
            last = match.index + match[0].length;
            // Escaped characters are masked for the read: an escaped `{` opens no block, and a block holding one is text.
            const rest = maskEscaped(
              value.slice(last),
              new Set([...escaped].map((at) => at - last))
            );
            const taken = read && leadingAttributes(rest, read);
            if (!taken) continue;
            addProperties(swapped, taken.properties);
            last += rest.length - taken.rest.length;
          }
          piece(value.length);
          return out;
        }
        return `children` in node && !skip?.has(node.type)
          ? [
              withChildren(
                node,
                rebuild(
                  node.children,
                  parsed,
                  inCell,
                  pattern,
                  swap,
                  skip,
                  node.type
                )
              )
            ]
          : [node];
      });
    // Link and footnote labels defined anywhere in the document. A re-parsed slice stands alone, and so does a base or a reading, so each gets a placeholder definition for each label; only recognition matters, since the spliced-back reference still resolves against the document's own definitions.
    let definitions = ``;
    const parseInline = (raw: string, inCell: boolean): MdastTarget[] => {
      const text = tidy(raw);
      if (!text) return [];
      const first = parseChildren(text + definitions)[0];
      if (first?.type === `paragraph` && `children` in first)
        return rebuild(first.children, text, inCell);
      // A base or a reading that opens with a tag is an HTML block when it stands alone, where in the document it is inline content, as markdown-it reads it. Parsed after a character, which is then dropped, it is a paragraph.
      if (first?.type === `html`) {
        const again = parseChildren(START + text + definitions)[0];
        const [lead, ...rest] =
          again?.type === `paragraph` && `children` in again
            ? rebuild(again.children, START + text, inCell)
            : [];
        if (lead?.type === `text` && lead.value.startsWith(START)) {
          const cut = {
            type: `text` as const,
            value: lead.value.slice(START.length)
          };
          carryEscapes(cut, textEscapes(lead, ``), START.length);
          return cut.value ? [cut, ...rest] : rest;
        }
      }
      return [{ type: `text`, value: text }];
    };
    const custom = (type: string, children: MdastTarget[]): Custom => ({
      type,
      data: { hName: type },
      children
    });
    const rpNode = (value: string): Custom =>
      custom(`rp`, [{ type: `text`, value }]);
    const rubyNode = (
      { base, reading }: Pick<Span, `base` | `reading`>,
      inCell: boolean
    ): Custom =>
      custom(`ruby`, [
        ...parseInline(base, inCell),
        ...(rp?.[0] && rp[1] ? [rpNode(rp[0])] : []),
        custom(`rt`, parseInline(reading, inCell)),
        ...(rp?.[0] && rp[1] ? [rpNode(rp[1])] : [])
      ]);
    // Swap each placeholder in re-parsed nodes for its ruby.
    const withRubies = (
      nodes: readonly MdastTarget[],
      spans: readonly Span[],
      parsed: string,
      inCell: boolean
    ): MdastTarget[] =>
      rebuild(nodes, parsed, inCell, PLACEHOLDER, (match) => {
        const span = spans[Number(match[1])];
        return span && rubyNode(span, inCell);
      });
    // For blocks holding nodes an earlier plugin built (no positions to re-read): convert only rubies inside a single text node. An escaped `{` opens nothing, where the node still says so (its own position, or the record a plugin that split it left).
    const withinText = (
      nodes: readonly MdastTarget[],
      inCell: boolean
    ): MdastTarget[] =>
      rebuild(
        nodes,
        source,
        inCell,
        RUBY_IN_TEXT,
        (match, escaped) =>
          escaped.has(match.index)
            ? undefined
            : rubyNode(
                {
                  base: baseOf(match[1] ?? ``, inCell),
                  reading: match[2] ?? ``
                },
                inCell
              ),
        OPAQUE
      );
    // Sätteri's attributes feature keeps `{.x}` outside the source range of the node it lands on, so a node re-parsed from that range has lost it: where the re-parse gave back the same shape, each node takes the `data` of the one it replaces.
    const inherit = (
      from: readonly MdastTarget[],
      to: readonly MdastTarget[]
    ): MdastTarget[] =>
      from.length === to.length &&
      from.every((node, i) => node.type === to[i]?.type)
        ? to.map((node, i): MdastTarget => {
            const old = from[i];
            if (!old || !(`children` in node) || !(`children` in old))
              return node;
            const copy = withChildren(
              node,
              inherit(old.children, node.children)
            );
            return old.data
              ? { ...copy, data: { ...copy.data, ...old.data } }
              : copy;
          })
        : [...to];

    const seen = new WeakSet<object>();
    return defineMdastPlugin({
      name: `ruby`,
      options: { position: true },
      before(root) {
        definitions = ``;
        if (!MAYBE_RUBY.test(source)) return;
        const labels: string[] = [];
        const walk = (node: MdastTarget): void => {
          if (node.type === `definition` && `label` in node) {
            labels.push(`[${String(node.label)}]: #`);
          } else if (node.type === `footnoteDefinition` && `label` in node) {
            labels.push(`[^${String(node.label)}]: #`);
          }
          if (`children` in node) node.children.forEach(walk);
        };
        walk(root);
        definitions = labels.length > 0 ? `\n\n${labels.join(`\n`)}` : ``;
      },
      text(node, ctx) {
        if (!node.value.includes(`{`)) return;
        let block: MdastTarget | undefined = ctx.parent(node);
        while (block && !INLINE_BLOCKS.has(block.type))
          block = ctx.parent(block);
        if (!block || seen.has(block) || !(`children` in block)) return;
        seen.add(block);
        const children: readonly MdastTarget[] = block.children;
        const inCell = block.type === `tableCell`;

        const range = (n: MdastTarget): [number, number] | undefined => {
          const start = n.position?.start.offset;
          const end = n.position?.end.offset;
          return start === undefined || end === undefined
            ? undefined
            : [start, end];
        };
        const positioned = (n: MdastTarget): boolean =>
          range(n) !== undefined &&
          (!(`children` in n) || (n.children ?? []).every(positioned));
        if (!children.every(positioned)) {
          ctx.setProperty(block, `children`, withinText(children, inCell));
          return;
        }

        // Rubies don't start inside opaque nodes, autolinks (`<…>`) or GFM literal links, which claim their text first.
        const skip: Array<[number, number]> = [];
        const collect = (n: MdastTarget): void => {
          const r = range(n);
          const autolink = n.type === `link` && r && source[r[0]] !== `[`;
          if (r && (OPAQUE.has(n.type) || autolink)) skip.push(r);
          if (`children` in n) n.children.forEach(collect);
        };
        children.forEach(collect);
        const from = range(children[0] ?? node)?.[0] ?? 0;
        const to = range(children.at(-1) ?? node)?.[1] ?? 0;
        const spans = findSpans(source, from, to, skip, inCell);
        if (spans.length === 0) return;

        // Group the rubies by the run of top-level children they overlap.
        const groups: Array<{ first: number; last: number; spans: Span[] }> =
          [];
        for (const span of spans) {
          const first = children.findIndex(
            (c) => (range(c)?.[1] ?? 0) > span.start
          );
          let last = first;
          while (
            last + 1 < children.length &&
            (range(children[last + 1] ?? node)?.[0] ?? Infinity) < span.end
          )
            last++;
          const previous = groups.at(-1);
          if (previous && first <= previous.last) {
            previous.last = Math.max(previous.last, last);
            previous.spans.push(span);
          } else {
            groups.push({ first, last, spans: [span] });
          }
        }

        let quotes = 0;
        for (let up = ctx.parent(block); up; up = ctx.parent(up)) {
          if (up.type === `blockquote`) quotes++;
        }
        const prefix = new RegExp(
          `(\\r\\n?|\\n)(?:[ \\t]*>){0,${String(quotes)}}[ \\t]*`,
          `g`
        );

        const next: MdastTarget[] = [];
        let cursor = 0;
        for (const group of groups) {
          next.push(...children.slice(cursor, group.first));
          const start = range(children[group.first] ?? node)?.[0] ?? 0;
          const end = range(children[group.last] ?? node)?.[1] ?? 0;
          let slice = ``;
          let at = start;
          group.spans.forEach((span, k) => {
            slice += source.slice(at, span.start) + OPEN + String(k) + CLOSE;
            at = span.end;
          });
          slice += source.slice(at, end);
          // Continuation lines carry container prefixes: the indentation of a list item, and one `>` for each block quote the block is in. They come off after each line ending, and no more than that: a `>` past the quotes' own is text the author wrote (a line indented four columns opens no quote).
          slice = slice.replace(prefix, `$1`);
          // A paragraph drops the whitespace at its own edges, but here it sits between the slice and a neighbouring node (`*x* {a|b}`): set it aside and put it back as text.
          const lead = /^[ \t\r\n]*/.exec(slice)?.[0] ?? ``;
          const content = slice.slice(lead.length).replace(/[ \t\r\n]+$/, ``);
          const trail = slice.slice(lead.length + content.length);
          // Every line after the first continues a paragraph, whatever it starts with (`>`, `-`, `#`, a fence). Parsed alone it would open a block and end the paragraph, so each is indented four columns, where nothing can open: the parser drops the indentation again.
          const body = content.replace(/\r\n?|\n/g, `$&${CONTINUATION}`);
          let parsed = body + definitions;
          let reparsed = parseChildren(parsed)[0];
          // A slice that ends in an attribute block loses it to the paragraph it is re-parsed as, though in the document, where the content goes on or the block isn't the last, it is text: parsed again with a character after it, which is then dropped, it stays text.
          if (reparsed?.data && `hProperties` in reparsed.data) {
            const again = parseChildren(body + END + definitions)[0];
            const kept = again && `children` in again ? again.children : [];
            const end = kept.at(-1);
            const value = end?.type === `text` ? end.value : undefined;
            if (again && end && value?.endsWith(END)) {
              parsed = body + END + definitions;
              reparsed = withChildren(again, [
                ...kept.slice(0, -1),
                { ...end, value: value.slice(0, -END.length) }
              ]);
            }
          }
          if (lead) next.push({ type: `text`, value: lead });
          next.push(
            ...withRubies(
              reparsed?.type === `paragraph` && `children` in reparsed
                ? inherit(
                    children.slice(group.first, group.last + 1),
                    reparsed.children
                  )
                : [{ type: `text`, value: content }],
              group.spans,
              parsed,
              inCell
            )
          );
          if (trail) next.push({ type: `text`, value: trail });
          cursor = group.last + 1;
        }
        next.push(...children.slice(cursor));
        // A block that ends the content went on the block, or on the one that holds it (a list item), before the ruby existed: it is the ruby's when the content ends with a ruby built here and the block was written touching it.
        const ruby = next.at(-1);
        const written = range(block);
        if (
          read &&
          written &&
          ruby?.type === `ruby` &&
          !children.includes(ruby)
        ) {
          const claimed = claimTrailingAttributes(
            source.slice(...written),
            block.type,
            [block, ctx.parent(block)],
            read
          );
          if (claimed) {
            ctx.setProperty(claimed.holder, `data`, claimed.data);
            addProperties(ruby, claimed.properties);
          }
        }
        ctx.setProperty(block, `children`, next);
      }
    });
  };
