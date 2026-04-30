import { readFile } from "node:fs/promises";
import { type Config, optimize as svgOptimize } from "svgo";
import type { GroupedImageNodes, ImageNodeGroup } from "./image-node.js";

export class SvgCache extends Map<string, string> {
  #hits = 0;
  #misses = 0;
  #queue: Array<Promise<void>> = [];

  get hits(): number {
    return this.#hits;
  }

  get misses(): number {
    return this.#misses;
  }

  read = async (groupedNodes: GroupedImageNodes, optimize: boolean | Config): Promise<void> => {
    const promises = [...groupedNodes].map(async (group) => this.#readFile(group, optimize));
    const queued = this.#queue.push(...promises);
    await Promise.all(this.#queue);
    this.#queue = this.#queue.slice(queued);
  };

  #readFile = async (group: ImageNodeGroup, optimize: boolean | Config): Promise<void> => {
    const [path, nodes] = group;

    if (this.has(path)) {
      this.#hits += nodes.length;
      return;
    }

    // Reserve the slot immediately to prevent concurrent reads of the same file
    this.set(path, ``);
    this.#misses++;
    this.#hits += nodes.length - 1;

    let content = await readFile(path, `utf-8`);

    if (optimize) {
      const optimizeConfig = typeof optimize === `boolean` ? {} : optimize;
      const optimized = svgOptimize(content, { path, ...optimizeConfig });
      content = optimized.data;
    }

    if (this.get(path)!.length > 0) {
      throw new Error(`SvgCache race condition: ${path} was read multiple times.`);
    }

    this.set(path, content);
  };
}
