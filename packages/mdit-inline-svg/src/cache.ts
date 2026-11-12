// An SVG's (optimized) content by absolute path, with the modification time and size it was read at: a dev server keeps the plugin while files are edited, so a file is read again once either changes.
export class SvgCache extends Map<
  string,
  { version: string; content: string }
> {
  #hits = 0;
  #misses = 0;

  get hits(): number {
    return this.#hits;
  }

  get misses(): number {
    return this.#misses;
  }

  addHits(n: number): void {
    this.#hits += n;
  }

  addMiss(): void {
    this.#misses++;
  }
}
