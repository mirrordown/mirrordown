import { readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { inlineSvgMarkup } from "@mirrordown/core";
import {
  defineHastPlugin,
  type HastVisitorInstance,
  type PluginFactoryContext
} from "satteri";
import { optimize as svgOptimize } from "svgo";
import { applyDefaults, type Options } from "./options.js";

export type { CacheEfficiency, Options } from "./options.js";

type AfterHook = NonNullable<HastVisitorInstance["after"]>;
type HastNode = Parameters<AfterHook>[0]["children"][number];
type Element = Extract<HastNode, { type: "element" }>;

/**
 * The plugin's definition: only the keys it defines, with a synchronous hook, so `markdownToHtml` returns its result directly.
 */
export interface InlineSvgPlugin {
  name: string;
  after: (...args: Parameters<AfterHook>) => void;
}

const isExternalUrl = (src: string): boolean => /^(?:[a-z]+:|\/\/)/i.test(src);

/**
 * Sätteri plugin that inlines referenced local `.svg` images as `<svg>` elements, relative to the document's `fileURL` compile option (Astro passes it); without one, images are left as they are. Files are read synchronously and cached across documents, as in `@mirrordown/mdit-inline-svg`. The limits, deduplication and markup are shared with the markdown-it and rehype plugins through `@mirrordown/core`. Node only: it reads from the file system.
 */
export const satteriInlineSvg = (
  config?: Partial<Options>
): ((ctx: PluginFactoryContext) => InlineSvgPlugin | null) => {
  const options = applyDefaults(config);
  const cache = new Map<string, string>();
  let hits = 0;
  let misses = 0;
  let reportedHits = 0;
  let reportedMisses = 0;

  // An SVG's (optimized) content, from the cache or the file system; `null` when it can't be read, which isn't cached.
  const read = (filePath: string, occurrences: number): string | null => {
    const cached = cache.get(filePath);
    if (cached !== undefined) {
      hits += occurrences;
      return cached;
    }
    try {
      let content = readFileSync(filePath, `utf-8`);
      if (options.optimize) {
        const optimizeConfig =
          typeof options.optimize === `boolean` ? {} : options.optimize;
        content = svgOptimize(content, {
          path: filePath,
          ...optimizeConfig
        }).data;
      }
      cache.set(filePath, content);
      misses++;
      hits += occurrences - 1;
      return content;
    } catch {
      return null;
    }
  };

  return ({ fileURL }) => {
    if (!fileURL) return null;
    const docDir = dirname(fileURLToPath(fileURL));
    return defineHastPlugin({
      name: `inline-svg`,
      // An SVG's markup depends on all its occurrences (the limits and deduplication count them), so the plugin collects every image before changing any.
      after(root, ctx) {
        const groups = new Map<string, Element[]>();
        const walk = (children: readonly HastNode[]): void => {
          for (const child of children) {
            if (child.type !== `element`) continue;
            const { src } = child.properties;
            if (
              child.tagName === `img` &&
              typeof src === `string` &&
              src.endsWith(`.svg`) &&
              !isExternalUrl(src)
            ) {
              const filePath = join(docDir, decodeURIComponent(src));
              groups.set(filePath, [...(groups.get(filePath) ?? []), child]);
            }
            walk(child.children);
          }
        };
        walk(root.children);

        for (const [filePath, images] of groups) {
          const content = read(filePath, images.length);
          if (content === null) continue;
          const markup = inlineSvgMarkup(
            content,
            images.map(({ properties: { alt } }) =>
              typeof alt === `string` ? alt : ``
            ),
            relative(docDir, filePath).split(sep).join(`/`),
            options
          );
          if (!markup) continue;
          images.forEach((image, index) => {
            ctx.replaceNode(image, { type: `raw`, value: markup[index] ?? `` });
          });
        }

        if (hits !== reportedHits || misses !== reportedMisses) {
          reportedHits = hits;
          reportedMisses = misses;
          options.cacheEfficiency({ hits, misses });
        }
      }
    });
  };
};
