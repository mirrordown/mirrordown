import { readFile, stat } from "node:fs/promises";
import { svgSpriteId } from "@mirrordown/core";
import { type Config, optimize as svgOptimize } from "svgo";

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

// An SVG's (optimized) content by absolute path, kept for the life of the plugin, with the modification time and size it was read at: a dev server keeps the plugin while files are edited, so a file is read again once either changes. The entry is the read itself, so documents processed concurrently share one read of a file and each waits for it. A file that can't be read or parsed resolves to `null` and isn't kept, as in the markdown-it and Sätteri plugins: the failure touches only the images that name it, and a later document tries again.
export class SvgCache {
  #hits = 0;
  #misses = 0;
  #reads = new Map<
    string,
    { version: string; content: Promise<string | null> }
  >();

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
    let version: string;
    try {
      const { mtimeMs, size } = await stat(path);
      version = `${String(mtimeMs)}:${String(size)}`;
    } catch {
      return null;
    }
    const entry = this.#reads.get(path);
    const cached = entry?.version === version ? entry.content : undefined;
    const pending = cached ?? this.#load(path, optimize);
    if (!cached) this.#reads.set(path, { version, content: pending });
    const content = await pending;
    if (content === null) {
      // Not kept, unless a newer read has taken its place.
      if (this.#reads.get(path)?.content === pending) this.#reads.delete(path);
      return null;
    }
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
      return optimizeSvg(
        content,
        path,
        typeof optimize === `boolean` ? {} : optimize
      );
    } catch {
      return null;
    }
  };
}
