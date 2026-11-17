import { readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { inlineSvgMarkup, svgSpriteId } from "@mirrordown/core";
import {
  defineHastPlugin,
  type HastVisitorInstance,
  type PluginFactoryContext
} from "satteri";
import { type Config, optimize as svgOptimize } from "svgo";
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

// SVGO's default preset shortens ids to `a`, `b`, …, so two inlined SVGs would both define `id="a"` and the second's `url(#a)` would pick up the first's gradient or clip path. Each file's ids get a prefix that hashes its content (line endings aside, so it is the same on every OS). A `plugins` list in the user's config replaces this one.
const optimizeSvg = (content: string, path: string, config: Config): string =>
  svgOptimize(content, {
    path,
    plugins: [
      `preset-default`,
      {
        name: `prefixIds`,
        params: {
          prefix: svgSpriteId(content.replace(/\r\n?/g, `\n`)),
          prefixClassNames: false
        }
      }
    ],
    ...config
  }).data;

// The file an image's `src` names, by the rule the markdown-it and rehype plugins share: decoded as a URL component and joined onto the document's directory, so a leading `/` stays under it. `null` when it names no local file: an external URL (also once decoded), or a malformed percent-escape, which makes `decodeURIComponent` throw.
const resolveSvgPath = (src: string, docDir: string): string | null => {
  if (isExternalUrl(src)) return null;
  try {
    const decoded = decodeURIComponent(src);
    return isExternalUrl(decoded) ? null : join(docDir, decoded);
  } catch {
    return null;
  }
};

/**
 * Sätteri plugin that inlines referenced local `.svg` images as `<svg>` elements, relative to the document's `fileURL` compile option (Astro passes it); without one, images are left as they are. Files are read synchronously and cached across documents, as in `@mirrordown/mdit-inline-svg`, and read again when their modification time or size changes. The limits, deduplication and markup are shared with the markdown-it and rehype plugins through `@mirrordown/core`. Node only: it reads from the file system.
 */
export const satteriInlineSvg = (
  config?: Partial<Options>
): ((ctx: PluginFactoryContext) => InlineSvgPlugin | null) => {
  const options = applyDefaults(config);
  // Each file's content with the modification time and size it was read at: a dev server keeps the plugin while files are edited, so a file is read again once either changes.
  const cache = new Map<string, { version: string; content: string }>();
  let hits = 0;
  let misses = 0;
  let reportedHits = 0;
  let reportedMisses = 0;

  // An SVG's (optimized) content, from the cache or the file system; `null` when it can't be read, which isn't cached.
  const read = (filePath: string, occurrences: number): string | null => {
    try {
      const { mtimeMs, size } = statSync(filePath);
      const version = `${String(mtimeMs)}:${String(size)}`;
      const cached = cache.get(filePath);
      if (cached?.version === version) {
        hits += occurrences;
        return cached.content;
      }
      let content = readFileSync(filePath, `utf-8`);
      if (options.optimize) {
        content = optimizeSvg(
          content,
          filePath,
          typeof options.optimize === `boolean` ? {} : options.optimize
        );
      }
      cache.set(filePath, { version, content });
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
            const filePath =
              child.tagName === `img` &&
              typeof src === `string` &&
              src.endsWith(`.svg`)
                ? resolveSvgPath(src, docDir)
                : null;
            if (filePath !== null) {
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
