export class RandomGenerator {
  constructor(seed) {
    this.seed = seed | 0;
  }

  setSeed(seed) {
    this.seed = seed | 0;
  }

  nextInt() {
    // Must use 32-bit integer math to match Java's behavior
    this.seed = (Math.imul(this.seed, 1593227) + 13) | 0;
    return this.seed >>> 16;
  }
}
