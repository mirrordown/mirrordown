// Rendering mermaid diagrams with Pele, shared by the markdown-it, rehype and Sätteri plugins: which elements hold a diagram, each diagram's id prefix, the attributes its `<svg>` takes, and the error a failed diagram throws. Rendering itself stays in the plugins, which depend on Pele, so this module has no dependencies.

import type { HastLike } from "./hast.js";

/** An HTML attribute, as markdown-it's tokens hold them. */
export type MermaidAttribute = [name: string, value: string];

/** The class a fenced `mermaid` block's `<code>` takes. */
const MERMAID_LANGUAGE_CLASS = `language-mermaid`;
/** The class a `<pre>` holding a diagram written as HTML takes, as Mermaid reads it in the browser. */
const MERMAID_PRE_CLASS = `mermaid`;

const hash = (str: string): string => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619) >>> 0;
  }
  return h.toString(36);
};

/** A diagram's source as Pele reads it: line endings normalized, as markdown-it already has them. */
export const mermaidSource = (text: string): string =>
  text.replace(/\r\n?/g, `\n`);

/**
 * A document's id prefixes, one per diagram in document order: `prefix`, then a hash of the diagram's source, so a diagram's ids don't change when others are edited, with `-2`, `-3`… for repeats of one diagram. Pele namespaces every id it writes (an accessible title, a gradient) under it. Create one per document.
 */
export const mermaidIdPrefixes = (
  prefix: string
): ((source: string) => string) => {
  const seen = new Map<string, number>();
  return (source) => {
    const id = `${prefix}-${hash(source)}`;
    const count = (seen.get(id) ?? 0) + 1;
    seen.set(id, count);
    return count === 1 ? id : `${id}-${count}`;
  };
};

const escapeAttribute = (value: string): string =>
  value.replace(/&/g, `&amp;`).replace(/"/g, `&quot;`);

const classes = (value: string): string[] =>
  value
    .split(/\s+/)
    .filter(
      (name) =>
        name !== `` &&
        name !== MERMAID_LANGUAGE_CLASS &&
        name !== MERMAID_PRE_CLASS
    );

/**
 * Pele's `<svg>` with the attributes the diagram's element had (from an attribute block such as `{#id .class}`): classes are added after Pele's, a style after Pele's (whose theme variables the diagram needs), and anything else is set, replacing Pele's value. The class that marked the element as a diagram is dropped.
 */
export const mermaidSvg = (
  svg: string,
  attributes: readonly MermaidAttribute[]
): string => {
  const open = /^<svg\b[^>]*>/.exec(svg)?.[0];
  if (!open || attributes.length === 0) return svg;
  const own = [...open.slice(4, -1).matchAll(/\s([^\s=]+)="([^"]*)"/g)].map(
    ([, name = ``, value = ``]): MermaidAttribute => [name, value]
  );
  const merged = new Map<string, string>(own);
  for (const [name, value] of attributes) {
    const escaped = escapeAttribute(value);
    const current = merged.get(name);
    if (name === `class`) {
      const added = classes(value).map(escapeAttribute).join(` `);
      if (added) merged.set(name, current ? `${current} ${added}` : added);
    } else if (name === `style` && current) {
      merged.set(name, `${current.replace(/;$/, ``)};${escaped}`);
    } else {
      merged.set(name, escaped);
    }
  }
  const tag = [...merged]
    .map(([name, value]) => ` ${name}="${value}"`)
    .join(``);
  return `<svg${tag}>${svg.slice(open.length)}`;
};

/** A hast element's properties as attributes; `className` becomes `class`, and other names are kept as the attribute plugins write them. */
export const hastAttributes = (
  properties: Record<string, unknown> | undefined
): MermaidAttribute[] => {
  // hast's property values: a string, a number, a boolean (present or absent) or a list.
  const text = (value: unknown): string | undefined =>
    typeof value === `string`
      ? value
      : typeof value === `number`
        ? String(value)
        : value === true
          ? ``
          : Array.isArray(value)
            ? value.map((item) => text(item) ?? ``).join(` `)
            : undefined;
  const attributes: MermaidAttribute[] = [];
  for (const [key, value] of Object.entries(properties ?? {})) {
    const written = text(value);
    if (written !== undefined)
      attributes.push([key === `className` ? `class` : key, written]);
  }
  return attributes;
};

const hasClass = (node: HastLike, name: string): boolean => {
  const value = node.properties?.className;
  return Array.isArray(value)
    ? value.includes(name)
    : typeof value === `string` && value.split(/\s+/).includes(name);
};

const textOf = (node: HastLike): string =>
  node.type === `text`
    ? (node.value ?? ``)
    : (node.children ?? []).map(textOf).join(``);

/**
 * The diagram a `<pre>` holds, as rehype-mermaid finds them: a `<pre>` whose only content (besides whitespace) is a `<code class="language-mermaid">`, which is how a fenced `mermaid` block renders, or a `<pre class="mermaid">`. `element` is the one whose attributes the `<svg>` takes. `undefined` for anything else.
 */
export const mermaidDiagram = (
  pre: HastLike
): { source: string; element: HastLike } | undefined => {
  if (pre.tagName !== `pre`) return undefined;
  if (hasClass(pre, MERMAID_PRE_CLASS))
    return { source: mermaidSource(textOf(pre)), element: pre };
  let code: HastLike | undefined;
  for (const child of pre.children ?? []) {
    if (child.type === `text` && /^\s*$/.test(child.value ?? ``)) continue;
    if (code || child.tagName !== `code`) return undefined;
    code = child;
  }
  return code && hasClass(code, MERMAID_LANGUAGE_CLASS)
    ? { source: mermaidSource(textOf(code)), element: code }
    : undefined;
};

/**
 * The error a diagram that failed to render throws: Pele's message, at the document line Pele located the problem on (counting from `line`, the line the diagram's element starts on), or at `line` itself when Pele has no location. The original error is the `cause`.
 */
export const mermaidFailure = (
  error: unknown,
  line: number | undefined
): Error => {
  const reason = error instanceof Error ? error.message : String(error);
  const within =
    error instanceof Error &&
    `line` in error &&
    typeof error.line === `number` &&
    error.line > 0
      ? error.line
      : 0;
  const at = line === undefined ? `` : ` on line ${String(line + within)}`;
  return new Error(`Could not render the mermaid diagram${at}: ${reason}`, {
    cause: error
  });
};
