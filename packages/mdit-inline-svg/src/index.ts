// Renderer rule callbacks receive `env: unknown`; casts to object are intentional for planMap keying.
/* oxlint-disable typescript/no-unsafe-type-assertion */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type MarkdownIt from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import { type Config, optimize as svgOptimize } from "svgo";
import { hash } from "./hash.js";
import { SvgCache } from "./cache.js";
import { applyDefaults, type Options } from "./options.js";

export type { CacheEfficiency, Options } from "./options.js";

const isExternalUrl = (src: string): boolean => /^(?:[a-z]+:|\/\/)/i.test(src);

const resolveSvgPath = (
  src: string,
  currentDocument: unknown
): string | null => {
  const decoded = decodeURIComponent(src);
  if (isExternalUrl(decoded)) return null;
  try {
    const currentFile = fileURLToPath(String(currentDocument));
    return join(dirname(currentFile), decoded);
  } catch {
    return null;
  }
};

const getAlt = (
  token: Token,
  md: MarkdownIt,
  options: MarkdownIt["options"],
  env: unknown
): string =>
  md.renderer.renderInlineAsText(token.children ?? [], options, env as object);

const extractSvgParts = (
  content: string
): { viewBox: string; width: string; height: string; inner: string } => {
  const openTag = /<svg([^>]*?)>/i.exec(content)?.[1] ?? ``;
  return {
    viewBox: /viewBox="([^"]*)"/i.exec(openTag)?.[1] ?? ``,
    width: /\bwidth="([^"]*)"/i.exec(openTag)?.[1] ?? ``,
    height: /\bheight="([^"]*)"/i.exec(openTag)?.[1] ?? ``,
    inner: /<svg[^>]*>([\s\S]*?)<\/svg\s*>/i.exec(content)?.[1]?.trim() ?? ``
  };
};

const escAttr = (s: string): string =>
  s.replace(/&/g, `&amp;`).replace(/"/g, `&quot;`);

const buildFullInline = (content: string, alt: string): string => {
  if (!alt) return content;
  return content.replace(
    /<svg([^>]*)>/i,
    `<svg$1 aria-label="${escAttr(alt)}">`
  );
};

const buildSpriteHtml = (id: string, viewBox: string, inner: string): string =>
  `<svg aria-hidden="true" style="display:none" xmlns="http://www.w3.org/2000/svg">` +
  `<defs><symbol id="${id}" viewBox="${escAttr(viewBox)}">${inner}</symbol></defs>` +
  `</svg>`;

const buildUseHtml = (
  id: string,
  viewBox: string,
  width: string,
  height: string,
  alt: string
): string => {
  const attrs = [
    viewBox && `viewBox="${escAttr(viewBox)}"`,
    width && `width="${escAttr(width)}"`,
    height && `height="${escAttr(height)}"`,
    alt && `aria-label="${escAttr(alt)}"`
  ]
    .filter(Boolean)
    .join(` `);
  return `<svg ${attrs}><use href="#${id}"></use></svg>`;
};

/** markdown-it plugin that inlines referenced `.svg` images as `<svg>` elements. */
export const inlineSvg = (md: MarkdownIt, config?: Partial<Options>): void => {
  const options = applyDefaults(config);
  const svgCache = new SvgCache();
  const planMap = new WeakMap<object, Map<Token, string | null>>();
  let prevHits = 0,
    prevMisses = 0;

  md.core.ruler.push(`inline_svg_scan`, (state) => {
    if (typeof state.env.currentDocument === `undefined`) return;

    const plan = new Map<Token, string | null>();
    planMap.set(state.env as object, plan);

    // Collect image tokens grouped by resolved path
    const pathGroups = new Map<string, Token[]>();

    for (const blockToken of state.tokens) {
      if (blockToken.type !== `inline` || !blockToken.children) continue;
      for (const token of blockToken.children) {
        if (token.type !== `image`) continue;
        const src = token.attrGet(`src`);
        if (!src || !src.endsWith(`.svg`)) continue;
        if (isExternalUrl(src)) {
          plan.set(token, null);
          continue;
        }
        const resolvedPath = resolveSvgPath(src, state.env.currentDocument);
        if (!resolvedPath) {
          plan.set(token, null);
          continue;
        }
        const group = pathGroups.get(resolvedPath) ?? [];
        group.push(token);
        pathGroups.set(resolvedPath, group);
      }
    }

    // Read, optimize, filter, and build plan for each path
    for (const [filePath, tokens] of pathGroups) {
      let content: string;

      if (svgCache.has(filePath)) {
        content = svgCache.get(filePath)!;
        svgCache.addHits(tokens.length);
      } else {
        try {
          let raw = readFileSync(filePath, `utf-8`);
          if (options.optimize) {
            const optimizeConfig: Config =
              typeof options.optimize === `boolean` ? {} : options.optimize;
            raw = svgOptimize(raw, { path: filePath, ...optimizeConfig }).data;
          }
          svgCache.set(filePath, raw);
          svgCache.addMiss();
          svgCache.addHits(tokens.length - 1);
          content = raw;
        } catch {
          for (const token of tokens) plan.set(token, null);
          continue;
        }
      }

      // Apply size and occurrence filters
      if (content.length > options.maxImageSize) {
        for (const token of tokens) plan.set(token, null);
        continue;
      }
      if (tokens.length > options.maxOccurrences) {
        for (const token of tokens) plan.set(token, null);
        continue;
      }
      if (tokens.length * content.length > options.maxTotalSize) {
        for (const token of tokens) plan.set(token, null);
        continue;
      }

      const { viewBox, width, height, inner } = extractSvgParts(content);

      if (options.deduplication && tokens.length > 1) {
        const id = `svg-sprite-${hash(filePath)}`;
        const sprite = buildSpriteHtml(id, viewBox, inner);
        for (let i = 0; i < tokens.length; i++) {
          const alt = getAlt(tokens[i], md, md.options, state.env);
          const use = buildUseHtml(id, viewBox, width, height, alt);
          plan.set(tokens[i], i === 0 ? sprite + use : use);
        }
      } else {
        for (const token of tokens) {
          const alt = getAlt(token, md, md.options, state.env);
          plan.set(token, buildFullInline(content, alt));
        }
      }
    }

    // Report cache efficiency when counts change
    if (svgCache.hits !== prevHits || svgCache.misses !== prevMisses) {
      prevHits = svgCache.hits;
      prevMisses = svgCache.misses;
      options.cacheEfficiency({ hits: svgCache.hits, misses: svgCache.misses });
    }
  });

  const imageRule =
    md.renderer.rules.image ??
    ((
      tokens: Token[],
      idx: number,
      opts: MarkdownIt["options"],
      _env: unknown,
      self: MarkdownIt["renderer"]
    ): string => self.renderToken(tokens, idx, opts));

  md.renderer.rules.image = (tokens, idx, opts, env, self): string => {
    const plan = planMap.get(env as object);
    const result = plan?.get(tokens[idx]);
    if (result === undefined || result === null) {
      return imageRule(tokens, idx, opts, env, self);
    }
    return result;
  };
};
