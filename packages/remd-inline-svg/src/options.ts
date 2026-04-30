import type { Config } from "svgo";

export interface Options {
  maxImageSize: number;
  maxOccurrences: number;
  maxTotalSize: number;
  optimize: boolean | Config;
  cacheEfficiency(results: CacheEfficiency): void;
}

export interface CacheEfficiency {
  hits: number;
  misses: number;
}

export const applyDefaults = (config: Partial<Options> = {}): Options => ({
  maxImageSize: config.maxImageSize ?? 3000,
  maxOccurrences: config.maxOccurrences ?? Infinity,
  maxTotalSize: config.maxTotalSize ?? 10000,
  optimize: config.optimize ?? true,
  cacheEfficiency: config.cacheEfficiency ?? ((): void => {}),
});
