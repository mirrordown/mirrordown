// The prompt plugins' shared logic: reading a ` ```prompt ` fence (or the `<pre>` a highlighter built from one), the AI services it links to, and the markup, so the markdown-it, rehype and Sätteri plugins write identical HTML.

import type { HastLike } from "../hast.js";
import { hastAttributes, mermaidIdPrefixes } from "../mermaid-pele.js";
import { PROMPT_SERVICE_ICONS } from "./icons.js";

export { PROMPT_SERVICE_ICONS };

/** The fence language a prompt is written in. */
export const PROMPT_LANGUAGE = "prompt";

/** The class on a prompt's outer element; its parts' classes start with it. */
export const PROMPT_CLASS = "markdown-prompt";

/** The invoker command the copy button sends to the prompt's `<pre>`, which the client script handles. Not copy-code's `--copy`, so a page with both scripts copies a block once. */
export const PROMPT_COMMAND = "--copy-prompt";

const LANGUAGE_CLASS = `language-${PROMPT_LANGUAGE}`;

/** An AI service a prompt can be opened in. */
export interface PromptService {
  /** The service's name, as the button's label says it: "Open in {label}". */
  label: string;
  /**
   * Where the button goes. With `{prompt}` in a query parameter's value, the service opens with the prompt filled in: give it only to a service that waits for the reader to send. Without it, the client script copies the prompt and the service opens for the reader to paste it.
   */
  url: string;
  /** The button's icon, as SVG markup; a generic one if none. */
  icon?: string;
}

/**
 * The built-in services. Each lands somewhere the reader reviews the prompt before it's sent: ChatGPT (`?prompt=`, not `?q=`, which sends at once), Claude and GitHub Copilot fill it in, Grok asks before sending, and Cursor previews it before handing it to the app. Perplexity sends a prompt it's given at once, and Gemini, Microsoft Copilot and Mistral take none, so they open for the reader to paste.
 */
export const PROMPT_SERVICES: Record<string, PromptService> = {
  chatgpt: { label: `ChatGPT`, url: `https://chatgpt.com/?prompt={prompt}` },
  claude: { label: `Claude`, url: `https://claude.ai/new?q={prompt}` },
  copilot: { label: `Copilot`, url: `https://copilot.microsoft.com/` },
  cursor: {
    label: `Cursor`,
    url: `https://cursor.com/link/prompt?text={prompt}`
  },
  gemini: { label: `Gemini`, url: `https://gemini.google.com/app` },
  "github-copilot": {
    label: `GitHub Copilot`,
    url: `https://github.com/copilot?prompt={prompt}`
  },
  grok: { label: `Grok`, url: `https://grok.com/?q={prompt}` },
  mistral: { label: `Le Chat`, url: `https://chat.mistral.ai/chat` },
  perplexity: { label: `Perplexity`, url: `https://www.perplexity.ai/` }
};

/** The services a prompt links to when its fence names none. */
export const PROMPT_DEFAULT_SERVICES: readonly string[] = [`claude`, `chatgpt`];

/** The text a prompt shows or says. */
export type PromptTextKey =
  | "title"
  | "copy"
  | "copied"
  | "open"
  | "copyOpen"
  | "paste"
  | "view"
  | "preview"
  | "markdown"
  | "hidden";

/** The default text. `{service}` is a service's label. */
export const PROMPT_TEXT: Record<PromptTextKey, string> = {
  title: `Prompt`,
  copy: `Copy prompt`,
  copied: `Copied prompt`,
  open: `Open in {service}`,
  copyOpen: `Copy, then open {service}`,
  paste: `Copied prompt. Paste it into {service}.`,
  view: `View`,
  preview: `Preview`,
  markdown: `Markdown`,
  hidden: `Contains invisible characters, marked in its markdown`
};

/** Options shared by the prompt plugins for every engine. */
export interface PromptOptions {
  /** Services to add, or built-in ones to replace, by id. A fence names them in its meta: ` ```prompt claude cursor `. */
  services?: Record<string, PromptService>;
  /** The services a prompt links to when its fence names none. Default: {@link PROMPT_DEFAULT_SERVICES}. `[]` leaves such prompts with only the copy button. */
  defaultServices?: readonly string[];
  /** The text a prompt shows or says. Defaults: {@link PROMPT_TEXT}. */
  text?: Partial<Record<PromptTextKey, string>>;
  /**
   * Highlights a prompt's text where the host doesn't: returns the HTML that goes in its `<code>`, such as Shiki's spans for the text read as markdown. Must be synchronous. A prompt the host's highlighter already highlighted (Astro's Shiki, or markdown-it's `highlight`) keeps that.
   */
  highlight?: (code: string) => string;
  /**
   * Whether a service that takes the prompt gets it through a GET form (the default), which keeps the prompt out of the links an agent reads. `false` writes links with the prompt in their URL instead, for hosts that open links but don't submit forms, such as VS Code's Markdown preview.
   */
  forms?: boolean;
}

/** An attribute from the fence (`{#id .class}`), as name and value. */
export type PromptAttribute = readonly [name: string, value: string];

/** A prompt the host's highlighter built: the HTML in its `<code>`, and its `<pre>`'s class and style. */
export interface PromptHighlight {
  html: string;
  className?: string;
  style?: string;
}

/** A prompt as the plugins find it. */
export interface PromptBlock {
  /** The prompt's text. */
  source: string;
  /** The fence's info string after its language. */
  meta?: string | undefined;
  /** Attributes from the fence, for the prompt's outer element. */
  attributes?: readonly PromptAttribute[];
  /** The host highlighter's version of the prompt, if it made one. */
  highlighted?: PromptHighlight | undefined;
}

/** A prompt's HTML, around its preview: the engine renders the prompt's markdown between the two, in a `<div class="markdown-prompt-preview">` ({@link PROMPT_PREVIEW_CLASS}), as it renders the rest of the page. */
export interface PromptMarkup {
  open: string;
  close: string;
}

// `name="value"`, `name='value'`, `name=value` or a word.
const META = /([\w-]+)=(?:"([^"]*)"|'([^']*)'|(\S+))|(\S+)/g;

/** What a fence's meta asks for: the services it names (in order), whether it starts open, and its title. */
export const parsePromptMeta = (
  meta: string | undefined,
  services: Readonly<Record<string, PromptService>>
): { services: string[]; open: boolean; title: string | undefined } => {
  const named: string[] = [];
  let open = false;
  let title: string | undefined;
  for (const match of (meta ?? ``).matchAll(META)) {
    const [, name, double, single, bare, word] = match;
    if (name === `title`) title = double ?? single ?? bare;
    else if (word === `open`) open = true;
    else if (word && Object.hasOwn(services, word) && !named.includes(word))
      named.push(word);
  }
  return { services: named, open, title };
};

const escapeText = (value: string): string =>
  value.replace(/&/g, `&amp;`).replace(/</g, `&lt;`).replace(/>/g, `&gt;`);

const escapeAttribute = (value: string): string =>
  value.replace(/&/g, `&amp;`).replace(/"/g, `&quot;`).replace(/</g, `&lt;`);

// A replacer function, here and for the prompt below: in a replacement string a `$&` or `$$` in the text put in would be a pattern.
const fill = (template: string, service: string): string =>
  template.replaceAll(`{service}`, () => service);

// Past this, a URL is too long for some services and servers to take, so the service opens for the reader to paste instead.
const MAX_URL_LENGTH = 8000;

// Stands in for the prompt while a service's URL is parsed.
const PLACEHOLDER = `MIRRORDOWNPROMPT`;

/**
 * How a service's button takes the prompt there: as a GET form whose hidden inputs hold the URL's query, the prompt among them, so the prompt is in no link an agent reads; or, where the prompt goes elsewhere in the URL (its path, or an app's own scheme), or `forms` is `false`, a link with it filled in; or, for a service whose URL doesn't take the prompt or would be too long with it, a link that opens the service while the client script copies the prompt.
 */
export const promptServiceTarget = (
  url: string,
  prompt: string,
  forms = true
):
  | { kind: `form`; action: string; inputs: Array<[string, string]> }
  | { kind: `link`; href: string; copy: boolean } => {
  if (!url.includes(`{prompt}`)) return { kind: `link`, href: url, copy: true };
  const filled = url.replaceAll(`{prompt}`, encodeURIComponent(prompt));
  if (!forms && filled.length <= MAX_URL_LENGTH)
    return { kind: `link`, href: filled, copy: false };
  // Without the prompt in it, for a service whose URL would be too long.
  const bare = (): string => {
    try {
      const parsed = new URL(url.replaceAll(`{prompt}`, ``));
      return `${parsed.origin}${parsed.pathname}`;
    } catch {
      return url.replaceAll(`{prompt}`, ``);
    }
  };
  if (filled.length > MAX_URL_LENGTH)
    return { kind: `link`, href: bare(), copy: true };
  let parsed: URL;
  try {
    parsed = new URL(url.replaceAll(`{prompt}`, PLACEHOLDER));
  } catch {
    return { kind: `link`, href: filled, copy: false };
  }
  const outside = `${parsed.origin}${parsed.pathname}${parsed.hash}`;
  if (
    (parsed.protocol !== `https:` && parsed.protocol !== `http:`) ||
    outside.includes(PLACEHOLDER)
  )
    return { kind: `link`, href: filled, copy: false };
  return {
    kind: `form`,
    action: `${parsed.origin}${parsed.pathname}`,
    inputs: [...parsed.searchParams].map(([name, value]) => [
      name,
      value.replaceAll(PLACEHOLDER, () => prompt)
    ])
  };
};

// Lucide's copy, check and sparkles icons (lucide.dev, ISC).
const lucide = (paths: string): string =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const COPY_ICON = lucide(
  `<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>`
);
const COPIED_ICON = lucide(`<path d="M20 6 9 17l-5-5"></path>`);
// The title's icon, and the one for a service without its own.
const SPARKLES_ICON = lucide(
  `<path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.14 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path><path d="M4 17v2"></path><path d="M5 18H3"></path>`
);
// Lucide's triangle-alert, for a prompt with invisible characters.
const WARNING_ICON = lucide(
  `<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>`
);
const SERVICE_ICON = lucide(
  `<path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.14 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z"></path>`
);

const icon = (svg: string, state?: string): string =>
  `<span class="${PROMPT_CLASS}-icon"${state ? ` data-state="${state}"` : ``} aria-hidden="true">${svg}</span>`;

/**
 * Characters that show as nothing, or that reorder the text around them, which can hide instructions in a prompt a reader would hand on without seeing: zero-width and other invisible characters, bidirectional controls, Unicode tags (which spell out ASCII no one sees) and the variation selectors past the first sixteen. The zero-width joiner and the first sixteen selectors are left out, because emoji are built with them.
 */
export const PROMPT_HIDDEN =
  /[\u00AD\u061C\u115F\u1160\u17B4\u17B5\u180E\u200B\u200C\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\u3164\uFEFF\uFFA0\u{E0000}-\u{E007F}]|\u034F|[\u{E0100}-\u{E01EF}]/gu;

// Each invisible character in the markdown view's HTML, in a mark the stylesheet labels with its code point. The character stays inside, so what's copied from the view is unchanged.
const markHidden = (html: string): string =>
  html.replace(PROMPT_HIDDEN, (char) => {
    const code = (char.codePointAt(0) ?? 0)
      .toString(16)
      .toUpperCase()
      .padStart(4, `0`);
    return `<span class="${PROMPT_CLASS}-hidden" data-char="U+${code}">${char}</span>`;
  });

// A highlighter's `<pre>` style, without anything that could end the attribute or declaration it's written into.
const safeStyle = (style: string | undefined): string =>
  (style ?? ``)
    .split(`;`)
    .map((declaration) => declaration.trim())
    .filter(
      (declaration) => declaration.includes(`:`) && !/[{}<>"]/.test(declaration)
    )
    .join(`;`);

/**
 * Builds prompts under the plugin's options, each given its document's id generator ({@link promptIds}). A prompt is a `<div class="markdown-prompt">` holding a `<details>`, whose `<summary>` is its title, and, after it, its actions: a copy button sending {@link PROMPT_COMMAND} to the prompt's `<pre>`, `hidden` until the client script shows it, and a button for each service. Opened, the `<details>` shows the prompt rendered as markdown, in a `<div class="markdown-prompt-preview">` the engine renders, with a radio pair to switch to its markdown, the `<pre>` (with the id), which is what the buttons copy and send. A prompt with invisible characters ({@link PROMPT_HIDDEN}) says so, opens on its markdown, and marks each one there. Returns the HTML before and after the preview, or `undefined` for an empty prompt, which stays a code block.
 */
export const createPrompt = (
  options: PromptOptions = {}
): ((
  block: PromptBlock,
  ids: (text: string) => string
) => PromptMarkup | undefined) => {
  const services = { ...PROMPT_SERVICES, ...options.services };
  const defaults = options.defaultServices ?? PROMPT_DEFAULT_SERVICES;
  const text = { ...PROMPT_TEXT, ...options.text };
  return ({ source, meta, attributes = [], highlighted }, ids) => {
    if (source.trim() === ``) return undefined;
    // Without the newline a fence ends with, which highlighters drop, so a prompt's id is the same whoever built its <pre>.
    const prompt = source.replace(/\r\n?/g, `\n`).replace(/\n$/, ``);
    const id = ids(prompt);
    const asked = parsePromptMeta(meta, services);
    const chosen = (
      asked.services.length > 0 ? asked.services : defaults
    ).filter((name) => Object.hasOwn(services, name));

    const outer = new Map<string, string>([[`class`, PROMPT_CLASS]]);
    for (const [name, value] of attributes) {
      const current = outer.get(name);
      if (name === `class`) {
        const added = value
          .split(/\s+/)
          .filter((item) => item !== `` && item !== LANGUAGE_CLASS)
          .join(` `);
        if (added) outer.set(name, `${current} ${added}`);
      } else {
        outer.set(name, value);
      }
    }
    const outerTag = [...outer]
      .map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`)
      .join(``);

    const preClass = [`${PROMPT_CLASS}-body`, highlighted?.className ?? ``]
      .join(` `)
      .trim();
    const style = safeStyle(highlighted?.style);
    const preStyle = style ? ` style="${escapeAttribute(style)}"` : ``;
    const code = markHidden(
      highlighted?.html ??
        (options.highlight ? options.highlight(prompt) : escapeText(prompt))
    );
    const pre = `<pre id="${id}" class="${preClass}"${preStyle}><code class="${LANGUAGE_CLASS}">${code}</code></pre>`;
    // The rendered prompt first, and its markdown a radio away: the same pair of views as a demo and its code. A prompt hiding characters opens on its markdown, where they're marked.
    const hidden = new RegExp(PROMPT_HIDDEN.source, `u`).test(prompt);
    const view = (name: `preview` | `markdown`, checked: boolean): string =>
      `<input type="radio" class="${PROMPT_CLASS}-view" name="${id}-view" id="${id}-${name}" value="${name}"${checked ? ` checked` : ``}><label for="${id}-${name}">${escapeText(text[name])}</label>`;
    const views = `<div class="${PROMPT_CLASS}-views" role="radiogroup" aria-label="${escapeAttribute(text.view)}">${view(`preview`, !hidden)}${view(`markdown`, hidden)}</div>`;
    const warning = hidden
      ? {
          title: `<span class="${PROMPT_CLASS}-warning" role="img" aria-label="${escapeAttribute(text.hidden)}">${WARNING_ICON}</span>`,
          note: `<p class="${PROMPT_CLASS}-note">${icon(WARNING_ICON)}${escapeText(text.hidden)}</p>`
        }
      : { title: ``, note: `` };

    const title = escapeText(asked.title ?? text.title);
    // The buttons' labels name what they do, and the stylesheet shows each as its tooltip.
    const copy = `<button type="button" class="${PROMPT_CLASS}-copy" command="${PROMPT_COMMAND}" commandfor="${id}" aria-label="${escapeAttribute(text.copy)}" data-label-copied="${escapeAttribute(text.copied)}" hidden>${icon(COPY_ICON, `copy`)}${icon(COPIED_ICON, `copied`)}</button>`;
    const buttons = chosen.map((name) => {
      const service = services[name];
      if (!service) return ``;
      const svg = icon(
        service.icon ?? PROMPT_SERVICE_ICONS[name] ?? SERVICE_ICON
      );
      const target = promptServiceTarget(service.url, prompt, options.forms);
      if (target.kind === `form`) {
        const label = escapeAttribute(fill(text.open, service.label));
        const inputs = target.inputs
          .map(
            ([input, value]) =>
              `<input type="hidden" name="${escapeAttribute(input)}" value="${escapeAttribute(value)}">`
          )
          .join(``);
        return `<form class="${PROMPT_CLASS}-service" data-service="${escapeAttribute(name)}" action="${escapeAttribute(target.action)}" method="get" target="_blank" rel="noopener noreferrer">${inputs}<button type="submit" aria-label="${label}">${svg}</button></form>`;
      }
      const label = escapeAttribute(
        fill(target.copy ? text.copyOpen : text.open, service.label)
      );
      const copied = target.copy
        ? ` data-copy="${escapeAttribute(fill(text.paste, service.label))}"`
        : ``;
      return `<a class="${PROMPT_CLASS}-service" data-service="${escapeAttribute(name)}" href="${escapeAttribute(target.href)}" target="_blank" rel="noopener noreferrer"${copied} aria-label="${label}">${svg}</a>`;
    });

    return {
      open: `<div${outerTag}><details class="${PROMPT_CLASS}-details"${asked.open ? ` open` : ``}><summary class="${PROMPT_CLASS}-title">${icon(SPARKLES_ICON)}${title}${warning.title}</summary><div class="${PROMPT_CLASS}-content">${warning.note}${views}`,
      close: `${pre}</div></details><div class="${PROMPT_CLASS}-actions">${copy}${buttons.join(``)}</div></div>`
    };
  };
};

/** The class of the element a prompt's preview renders in. */
export const PROMPT_PREVIEW_CLASS = "markdown-prompt-preview";

/** The custom mdast node types the remark and Sätteri plugins wrap a prompt's code block and its parsed preview in, for their hast plugins to build the prompt from: a `<div class="markdown-prompt">` holding the `<pre>` and a `<div class="markdown-prompt-preview">`. The preview stays an element, so the plugins after them see its content nested, as in a blockquote, rather than among the page's top-level blocks. */
export const PROMPT_NODE = "prompt";
export const PROMPT_PREVIEW_NODE = "promptPreview";

interface PromptPoint {
  line: number;
  column: number;
  offset?: number | undefined;
}
interface PromptPositioned {
  position?: { start: PromptPoint; end: PromptPoint } | undefined;
  children?: unknown;
}

// Where each line of a text starts.
const lineStarts = (value: string): number[] => {
  const starts = [0];
  for (
    let index = value.indexOf(`\n`);
    index !== -1;
    index = value.indexOf(`\n`, index + 1)
  )
    starts.push(index + 1);
  return starts;
};

// A line of a text, without its line ending.
const lineOf = (value: string, starts: number[], index: number): string =>
  value
    .slice(starts[index], starts[index + 1] ?? value.length)
    .replace(/\r?\n$/, ``);

/**
 * Moves the positions of a prompt's preview, parsed from the prompt's text alone, onto the document's source, so plugins that read the source at a node's position read the document there. `fence` is the line (1-based) of the fence that opens the prompt: each line of the prompt is the end of a line after it, past any blockquote markers or indentation. A node that can't be placed (one on a line whose tabs became spaces, or with no source to place it in) loses its position, as nodes a plugin builds have none.
 */
export const placePromptPositions = (
  nodes: readonly PromptPositioned[],
  value: string,
  source: string | undefined,
  fence: number | undefined
): void => {
  const own = lineStarts(value);
  const document = source === undefined ? [] : lineStarts(source);
  const place = (point: PromptPoint): PromptPoint | undefined => {
    if (source === undefined || fence === undefined) return undefined;
    const { offset } = point;
    if (offset === undefined) return undefined;
    let index = own.length - 1;
    while (index > 0 && (own[index] ?? 0) > offset) index -= 1;
    const line = fence + index;
    const start = document[line];
    if (start === undefined) return undefined;
    const ownLine = lineOf(value, own, index);
    const documentLine = lineOf(source, document, line);
    if (!documentLine.endsWith(ownLine)) return undefined;
    const column =
      documentLine.length - ownLine.length + offset - (own[index] ?? 0);
    return { line: line + 1, column: column + 1, offset: start + column };
  };
  const visit = (node: PromptPositioned): void => {
    if (node.position) {
      const start = place(node.position.start);
      const end = place(node.position.end);
      if (start && end) node.position = { start, end };
      else delete node.position;
    }
    const children: unknown = node.children;
    if (Array.isArray(children)) for (const child of children) visit(child);
  };
  for (const node of nodes) visit(node);
};

/** A document's prompt ids, one per prompt in document order: `prompt-` and a hash of its text, with `-2`, `-3`… for repeats. Create one per document. */
export const promptIds = (): ((text: string) => string) =>
  mermaidIdPrefixes(`prompt`);

const textOf = (node: HastLike): string =>
  node.type === `text`
    ? (node.value ?? ``)
    : (node.children ?? []).map(textOf).join(``);

const classes = (node: HastLike): string[] => {
  const value = node.properties?.className ?? node.properties?.class;
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === `string`)
    : typeof value === `string`
      ? value.split(/\s+/).filter(Boolean)
      : [];
};

// A hast property's attribute name: `className` is `class`, and `dataLine` is `data-line`.
const attributeName = (property: string): string =>
  property === `className`
    ? `class`
    : /^data[A-Z]/.test(property)
      ? property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
      : property;

// The HTML of the elements a highlighter put in a `<code>`: its spans, with their classes and styles.
const toHtml = (nodes: readonly HastLike[]): string =>
  nodes
    .map((node) => {
      if (node.type === `text`) return escapeText(node.value ?? ``);
      if (node.type !== `element` || !node.tagName) return ``;
      const attributes = hastAttributes(node.properties)
        .map(
          ([name, value]) =>
            ` ${attributeName(name)}="${escapeAttribute(value)}"`
        )
        .join(``);
      return `<${node.tagName}${attributes}>${toHtml(node.children ?? [])}</${node.tagName}>`;
    })
    .join(``);

const metaOf = (code: HastLike, pre: HastLike): string | undefined => {
  const meta =
    (code as HastLike & { data?: { meta?: unknown } }).data?.meta ??
    pre.properties?.dataMeta;
  return typeof meta === `string` ? meta : undefined;
};

/**
 * The prompt a hast `<pre>` holds: a `<pre>` whose only element child is a `<code class="language-prompt">`, as a ` ```prompt ` fence renders, or one a highlighter built from such a fence, marked `data-language="prompt"` (as Astro's Shiki marks them, keeping the fence's meta in `data-meta` with a transformer), whose highlighting the prompt keeps. `undefined` for anything else.
 */
export const promptBlock = (pre: HastLike): PromptBlock | undefined => {
  if (pre.type !== `element` || pre.tagName !== `pre`) return undefined;
  const elements = (pre.children ?? []).filter(
    (child) => child.type === `element`
  );
  const [code] = elements;
  if (elements.length !== 1 || code?.tagName !== `code`) return undefined;
  if (classes(code).includes(LANGUAGE_CLASS))
    return {
      source: textOf(code),
      meta: metaOf(code, pre),
      attributes: hastAttributes(code.properties)
    };
  if (pre.properties?.dataLanguage !== PROMPT_LANGUAGE) return undefined;
  const style = pre.properties.style;
  return {
    source: textOf(code),
    meta: metaOf(code, pre),
    highlighted: {
      html: toHtml(code.children ?? []),
      className: classes(pre).join(` `),
      ...(typeof style === `string` ? { style } : {})
    }
  };
};

/**
 * What a highlighter returned for a prompt, as markdown-it's `highlight` option returns it: either the HTML for the `<code>`, or a whole `<pre>` (as VitePress's Shiki builds), whose class, style and `<code>` content are kept.
 */
export const promptHighlight = (html: string): PromptHighlight => {
  const pre =
    /^\s*<pre\b([^>]*)>\s*<code\b[^>]*>([\s\S]*)<\/code>\s*<\/pre>\s*$/.exec(
      html
    );
  if (!pre) return { html };
  const attributes = pre[1] ?? ``;
  // The attribute's value as written, with its character references decoded, so the style's checks see the quotes and brackets it holds.
  const attribute = (name: string): string | undefined =>
    new RegExp(`\\s${name}="([^"]*)"`)
      .exec(attributes)?.[1]
      ?.replace(/&quot;|&#34;|&#x22;/gi, `"`)
      .replace(/&lt;|&#60;|&#x3c;/gi, `<`)
      .replace(/&gt;|&#62;|&#x3e;/gi, `>`)
      .replace(/&amp;|&#38;|&#x26;/gi, `&`);
  const className = attribute(`class`);
  const style = attribute(`style`);
  return {
    html: pre[2] ?? ``,
    ...(className === undefined ? {} : { className }),
    ...(style === undefined ? {} : { style })
  };
};
