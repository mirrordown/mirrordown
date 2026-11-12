import { readFile } from "node:fs/promises";
import { type Config, optimize as svgOptimize } from "svgo";

// An SVG's (optimized) content by absolute path, kept for the life of the plugin. The entry is the read itself, so documents processed concurrently share one read of a file and each waits for it. A file that can't be read or parsed resolves to `null` and isn't kept, as in the markdown-it and Sätteri plugins: the failure touches only the images that name it, and a later document tries again.
export class SvgCache {
  #hits = 0;
  #misses = 0;
  #reads = new Map<string, Promise<string | null>>();

  get hits(): number {
    return this.#hits;
  }

  get misses(): number {
    return this.#misses;
  }

  read = async (
    path: string,
    occurrences: number,
    optimize: boolean | Config
  ): Promise<string | null> => {
    const cached = this.#reads.get(path);
    const pending = cached ?? this.#load(path, optimize);
    if (!cached) this.#reads.set(path, pending);
    const content = await pending;
    if (content === null) return null;
    if (cached) {
      this.#hits += occurrences;
    } else {
      this.#misses++;
      this.#hits += occurrences - 1;
    }
    return content;
  };

  #load = async (
    path: string,
    optimize: boolean | Config
  ): Promise<string | null> => {
    try {
      const content = await readFile(path, `utf-8`);
      if (!optimize) return content;
      const optimizeConfig = typeof optimize === `boolean` ? {} : optimize;
      return svgOptimize(content, { path, ...optimizeConfig }).data;
    } catch {
      this.#reads.delete(path);
      return null;
    }
  };
}
