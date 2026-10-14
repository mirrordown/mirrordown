import type { PhrasingLike } from "./github-alerts/index.js";

// The scan behind `==mark==`, `++ins++` and `--del--`, shared by the remark and
// Sätteri plugins. It is a pure function over a parent's children: remark runs
// it on mutable nodes, Sätteri on read-only ones (it builds new nodes and
// reuses the rest).

/** The patterns that find a delimited run. */
export interface DelimiterPatterns {
  /** A complete run inside one text node; group 1 is its content. Global. */
  within: RegExp;
  /** An opening delimiter whose run closes in a later sibling. */
  opening: RegExp;
  /** A closing delimiter for a run opened in an earlier sibling. */
  closing: RegExp;
}

/** `==mark==`. Lookarounds keep equality operators (`a == b`) from matching. */
export const MARK_DELIMITERS: DelimiterPatterns = {
  within: /==(?![\s=])([\s\S]*?)(?<![\s=])==/g,
  opening: /==(?![\s]|=+\s)/,
  closing: /(?<!\s|\s=|\s==|\s===|\s====)==/
};

/** How a delimited run becomes nodes. */
export interface DelimitedNodes<N extends PhrasingLike> {
  /** A text node with the given value. */
  text: (value: string) => N;
  /** The node a run's content is wrapped in (e.g. an mdast `mark`). */
  wrap: (children: N[]) => N;
}

/** Transform a parent's children, and report which nodes it created. */
export interface DelimitedTransform<N extends PhrasingLike> {
  (children: readonly N[]): N[];
  /** Whether `node` was built by this transform (a wrapper or a split text). */
  built: (node: object) => boolean;
}

/**
 * Build the scan for one delimited syntax. Pass 1 wraps runs that sit inside a
 * single text node; pass 2 wraps a run opened in one text node and closed in a
 * later sibling text node, taking everything between. Runs nested in a wrapper
 * this scan creates are found too.
 */
export const createDelimitedTransform = <N extends PhrasingLike>(
  patterns: DelimiterPatterns,
  nodes: DelimitedNodes<N>
): DelimitedTransform<N> => {
  const built = new WeakSet<object>();
  const text = (value: string): N => {
    const node = nodes.text(value);
    built.add(node);
    return node;
  };
  // Each wrapper's content, kept typed for the descent in pass 2.
  const wrapped = new WeakMap<object, N[]>();
  const wrap = (children: N[]): N => {
    const node = nodes.wrap(children);
    built.add(node);
    wrapped.set(node, children);
    return node;
  };
  const within = new RegExp(
    patterns.within.source,
    patterns.within.flags.replace(`g`, ``)
  );

  const splitWithinText = (children: readonly N[]): N[] =>
    children.flatMap((node) => {
      const value = node.type === `text` ? node.value : undefined;
      if (value === undefined || !within.test(value)) return [node];
      const out: N[] = [];
      let last = 0;
      for (const match of value.matchAll(patterns.within)) {
        if (match.index > last) out.push(text(value.slice(last, match.index)));
        out.push(wrap([text((match[1] ?? ``).trim())]));
        last = match.index + match[0].length;
      }
      if (last < value.length) out.push(text(value.slice(last)));
      return out;
    });

  const joinAcrossSiblings = (input: readonly N[]): N[] => {
    let children = [...input];
    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      if (!node) continue;
      const content = wrapped.get(node);
      if (content) {
        children[i] = wrap(joinAcrossSiblings(content));
        continue;
      }
      const value = node.type === `text` ? node.value : undefined;
      const open = value === undefined ? null : patterns.opening.exec(value);
      if (value === undefined || !open) continue;
      const close = children.findIndex(
        (n, j) =>
          j > i && n.type === `text` && patterns.closing.test(n.value ?? ``)
      );
      const closing = children[close];
      const closingValue = closing?.value;
      const end =
        closingValue === undefined ? null : patterns.closing.exec(closingValue);
      if (closingValue === undefined || !end) continue;

      const before = children.slice(0, i);
      const main = children.slice(i + 1, close);
      const after = children.slice(close + 1);
      if (open.index > 0) before.push(text(value.slice(0, open.index)));
      const openRest = value.slice(open.index + open[0].length);
      if (openRest) main.unshift(text(openRest));
      if (end.index > 0) main.push(text(closingValue.slice(0, end.index)));
      const closeRest = closingValue.slice(end.index + end[0].length);
      if (closeRest) after.unshift(text(closeRest));
      children = [...before, wrap(main), ...after];
      // Re-scan from the restructured position, descending into the new wrapper.
      i = before.length - 1;
    }
    return children;
  };

  const transform = (children: readonly N[]): N[] =>
    joinAcrossSiblings(splitWithinText(children));
  return Object.assign(transform, { built: (node: object) => built.has(node) });
};
