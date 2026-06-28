import type { Config } from "svgo";

/** Options for the inline-svg plugin. */
export interface Options {
  /** Skip inlining SVGs larger than this many bytes. */
  maxImageSize: number;
  /** Maximum number of images to inline per render. */
  maxOccurrences: number;
  /** Maximum total inlined bytes per render. */
  maxTotalSize: number;
  /** Optimize SVGs with SVGO; pass a `Config` to customize, or `false` to skip. */
  optimize: boolean | Config;
  /** Reuse repeated icons via `<symbol>`/`<use>`. */
  deduplication: boolean;
  /** Callback invoked with cache hit/miss counts after each render. */
  cacheEfficiency(results: CacheEfficiency): void;
}

/** Cache hit/miss counts reported via {@link Options.cacheEfficiency}. */
export interface CacheEfficiency {
  /** Number of SVGs served from cache. */
  hits: number;
  /** Number of SVGs read from disk. */
  misses: number;
}

export const applyDefaults = (config: Partial<Options> = {}): Options => ({
  maxImageSize: config.maxImageSize ?? 3000,
  maxOccurrences: config.maxOccurrences ?? Infinity,
  maxTotalSize: config.maxTotalSize ?? 10000,
  optimize: config.optimize ?? true,
  deduplication: config.deduplication ?? false,
  cacheEfficiency: config.cacheEfficiency ?? ((): void => {})
});
