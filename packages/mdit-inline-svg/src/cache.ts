export class SvgCache extends Map<string, string> {
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
