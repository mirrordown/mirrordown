import { maskEscaped, textEscapes } from "./escapes.js";
import type { PhrasingLike } from "./github-alerts/index.js";
import {
  createSpanTransform,
  type Positioned,
  type SpanNodes,
  type SpanTransform
} from "./spans.js";

// The scan behind `[[key]]`, shared by the remark and Sätteri plugins. It follows markdown-it-kbd's tokenizer: from a `[[`, it walks forward counting nested `[[` and `]]` until the depth returns to zero, gives up at a line ending, and parses the content again for nested keys. It works on one parent's children: text is scanned character by character, other nodes are opaque. markdown-it-kbd scans source text ahead of the link rule, so two things are done to read the tree the same way: a link whose opening bracket is half of a `[[` is laid out as its source characters again (see `flatten`), and nesting stops at markdown-it's limit. One difference is inherent: markdown-it-kbd claims `[[*a]]*` before emphasis is resolved, while remark and Sätteri have parsed the emphasis before a plugin runs.

/** The parts of a link node the scan reads. */
type LinkLike = Positioned & {
  referenceType?: string | undefined;
  label?: string | null | undefined;
};

/** One step of the scan: a character of text, or a whole node. The opening bracket of a link laid out as characters carries the link and the number of units it takes up. */
type Unit<N> = { char: string; link?: { node: N; span: number } } | { node: N };

// markdown-it's `maxNesting`: a key nested deeper than this stays text.
const MAX_DEPTH = 100;
const ASCII_PUNCTUATION = /^[!-/:-@[-`{-~]$/;

const isChar = (unit: Unit<PhrasingLike> | undefined, char: string): boolean =>
  unit !== undefined && `char` in unit && unit.char === char;

const isLineEnding = (unit: Unit<PhrasingLike> | undefined): boolean =>
  isChar(unit, `\n`) ||
  isChar(unit, `\r`) ||
  (unit !== undefined && `node` in unit && unit.node.type === `break`);

const chars = <N>(value: string): Array<Unit<N>> =>
  Array.from(value, (char) => ({ char }));

/**
 * Build the `[[key]]` scan. `source` is the document the nodes' positions refer to; with it, a key wins over an inline link that shares its opening brackets. Set `mask` when the text of the nodes passed in is not masked below the top level (Sätteri, whose nodes are read-only), so the scan masks the text of a link it lays out.
 */
export const createKbdTransform = <N extends PhrasingLike & LinkLike>(
  nodes: SpanNodes<N>,
  source?: string,
  mask = false
): SpanTransform<N> =>
  createSpanTransform(nodes, (children, _parentType, { text, wrap }) => {
    /** What follows a link's text in the source, from its closing bracket on, or `undefined` when it cannot be told. */
    const tail = (link: N, kids: readonly N[]): Array<Unit<N>> | undefined => {
      const start = link.position?.start.offset;
      const end = link.position?.end.offset;
      if (link.type === `linkReference`) {
        if (link.referenceType !== `full`) {
          return chars(link.referenceType === `collapsed` ? `][]` : `]`);
        }
        // `[text][label]` without its text is `[label]`, a reference of its own, unless what follows would make it part of another link: that needs a parser to tell, so the link is left as it is.
        if (
          !source ||
          end === undefined ||
          `[(`.includes(source.charAt(end) || ` `)
        ) {
          return undefined;
        }
        const label = text(link.label ?? ``);
        return [
          { char: `]` },
          { node: { ...link, referenceType: `shortcut`, children: [label] } }
        ];
      }
      const from = kids.length ? kids.at(-1)?.position?.end.offset : start;
      if (
        source === undefined ||
        start === undefined ||
        end === undefined ||
        from === undefined ||
        // An autolink is a link without brackets.
        source.charAt(start) !== `[`
      ) {
        return undefined;
      }
      const raw = source.slice(kids.length ? from : from + 1, end);
      const literal = new Set<number>();
      let value = ``;
      for (let i = 0; i < raw.length; i++) {
        if (raw[i] === `\\` && ASCII_PUNCTUATION.test(raw.charAt(i + 1))) {
          literal.add(value.length);
          i++;
        }
        value += raw[i];
      }
      return raw.startsWith(`]`)
        ? chars(maskEscaped(value, literal))
        : undefined;
    };

    /**
     * A link as the characters it was written with: `[`, its content, and the rest of its syntax. markdown-it-kbd reads `[[` before any link, so a link is laid out this way when its opening bracket could be half of an opener: it follows a `[`, or its text starts with one. The scan folds it back into the link unless a key takes that bracket.
     */
    const flatten = (
      link: N,
      afterBracket: boolean
    ): Array<Unit<N>> | undefined => {
      if (link.type !== `link` && link.type !== `linkReference`) return;
      // A link's children are phrasing content, like the link itself.
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      const kids = (link.children ?? []) as readonly N[];
      const first = kids[0];
      const opens = first?.type === `text` && first.value?.startsWith(`[`);
      if (!afterBracket && !opens) return;
      const rest = tail(link, kids);
      if (!rest) return;
      const inner = kids.flatMap((kid): Array<Unit<N>> => {
        if (kid.type !== `text` || kid.value === undefined) {
          return [{ node: kid }];
        }
        const only = kids.length === 1;
        return chars(
          mask && source !== undefined
            ? maskEscaped(kid.value, textEscapes(kid, source, link.type, only))
            : kid.value
        );
      });
      const span = 1 + inner.length + rest.length;
      return [{ char: `[`, link: { node: link, span } }, ...inner, ...rest];
    };

    const units: Array<Unit<N>> = [];
    for (const child of children) {
      const flat =
        child.type === `text` && child.value !== undefined
          ? chars<N>(child.value)
          : (flatten(child, isChar(units.at(-1), `[`)) ?? [{ node: child }]);
      for (const unit of flat) units.push(unit);
    }

    // Scan a stretch of units into nodes; a key's content is scanned again, as markdown-it-kbd tokenizes it.
    const scan = (
      list: ReadonlyArray<Unit<N>>,
      depth: number
    ): { nodes: N[]; keyed: boolean } => {
      const pair = (i: number, char: string): boolean =>
        isChar(list[i], char) && isChar(list[i + 1], char);
      // The units of the laid-out link that starts at `i`, when all of them are in this stretch.
      const linkAt = (i: number): { node: N; span: number } | undefined => {
        const unit = list[i];
        return unit &&
          `char` in unit &&
          i + (unit.link?.span ?? 0) <= list.length
          ? unit.link
          : undefined;
      };

      // How many levels a walk standing at each unit can still close before the line ends. An opener is tried only when its walk closes, which keeps a line of unclosed openers linear.
      const levels: number[] = [];
      const closable = (i: number): number => levels[i] ?? 0;
      for (let i = list.length - 1; i >= 0; i--) {
        if (pair(i, `]`)) levels[i] = closable(i + 2) + 1;
        else if (pair(i, `[`)) levels[i] = Math.max(0, closable(i + 2) - 1);
        else if (linkAt(i)) levels[i] = closable(i + (linkAt(i)?.span ?? 1));
        else if (!isLineEnding(list[i])) levels[i] = closable(i + 1);
        else levels[i] = 0;
      }

      /**
       * The index of the `]]` that closes the `[[` at `start`, or -1. This mirrors markdown-it-kbd's walk, which starts at the opener's second `[`, takes brackets in pairs, and steps over a link as one unit.
       */
      const findClose = (start: number): number => {
        const nested = pair(start + 1, `[`);
        if (closable(nested ? start + 3 : start + 2) < (nested ? 2 : 1)) {
          return -1;
        }
        let open = 1;
        for (let i = start + 1; i < list.length; i++) {
          if (pair(i, `]`)) {
            open--;
            if (open === 0) return i;
            i++;
          } else if (pair(i, `[`)) {
            open++;
            i++;
          } else if (i > start + 1 && linkAt(i)) {
            i += (linkAt(i)?.span ?? 1) - 1;
          }
        }
        return -1;
      };

      const out: N[] = [];
      let keyed = false;
      let buffer = ``;
      const flushText = (): void => {
        if (buffer) out.push(text(buffer));
        buffer = ``;
      };
      for (let i = 0; i < list.length;) {
        const unit = list[i];
        const end = depth < MAX_DEPTH && pair(i, `[`) ? findClose(i) : -1;
        const link = linkAt(i);
        if (end >= 0) {
          keyed = true;
          flushText();
          out.push(wrap(scan(list.slice(i + 2, end), depth + 1).nodes));
          i = end + 2;
        } else if (link) {
          // No key took the link's opening bracket: it is the link it was.
          flushText();
          out.push(link.node);
          i += link.span;
        } else {
          if (unit && `char` in unit) buffer += unit.char;
          else if (unit) {
            flushText();
            out.push(unit.node);
          }
          i++;
        }
      }
      flushText();
      return { nodes: out, keyed };
    };

    const { nodes: result, keyed } = scan(units, 0);
    return keyed ? result : children;
  });
