// Renderer rule callbacks receive `env: unknown`; casts to object are intentional for planMap keying.
/* oxlint-disable typescript/no-unsafe-type-assertion */
import { readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import type MarkdownIt from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import { type Config, optimize as svgOptimize } from "svgo";
import { inlineSvgMarkup } from "@mirrordown/core";
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
): string => md.renderer.renderInlineAsText(token.children ?? [], options, env);

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

      // The limits, deduplication and markup are shared with the rehype and Sätteri plugins through `@mirrordown/core`.
      const docDir = dirname(fileURLToPath(String(state.env.currentDocument)));
      const markup = inlineSvgMarkup(
        content,
        tokens.map((token) => getAlt(token, md, md.options, state.env)),
        relative(docDir, filePath).split(sep).join(`/`),
        options
      );
      tokens.forEach((token, index) => {
        plan.set(token, markup?.[index] ?? null);
      });
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
