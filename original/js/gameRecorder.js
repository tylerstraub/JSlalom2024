import { RandomGenerator } from './randomGenerator.js';

export class GameRecorder {
  constructor() {
    this.seed = (Date.now() & 0xFFFFFFFF) | 0;
    this.random = new RandomGenerator(this.seed);
    this.data = new Int32Array(2048);
    this.pos = 0;
    this.maxpos = 0;
    this.startScore = 0;
    this.startRound = 0;
  }

  writeStatus(status) {
    if (this.pos < this.data.length * 16) {
      const idx = (this.pos / 16) | 0;
      const shift = (this.pos % 16) * 2;
      this.data[idx] |= status << shift;
      this.pos++;
      if (this.pos > this.maxpos) {
        this.maxpos = this.pos;
      }
    }
  }

  readStatus() {
    if (this.pos >= this.data.length * 16) {
      return 0;
    }
    const idx = (this.pos / 16) | 0;
    const shift = (this.pos % 16) * 2;
    const val = (this.data[idx] >>> shift) & 3;
    this.pos++;
    return val;
  }

  getRandom() {
    return this.random.nextInt() & 0x7FFFFFFF;
  }

  toStart() {
    this.pos = 0;
    this.random.setSeed(this.seed);
  }

  toJSON() {
    const wordCount = Math.ceil(this.maxpos / 16);
    const dataSlice = Array.from(this.data.subarray(0, wordCount));
    return {
      seed: this.seed,
      maxpos: this.maxpos,
      startRound: this.startRound,
      startScore: this.startScore,
      data: dataSlice
    };
  }

  static fromJSON(json) {
    const rec = new GameRecorder();
    rec.seed = json.seed;
    rec.maxpos = json.maxpos;
    rec.startRound = json.startRound;
    rec.startScore = json.startScore;
    rec.random = new RandomGenerator(rec.seed);
    const arr = json.data;
    for (let i = 0; i < arr.length; i++) {
      rec.data[i] = arr[i];
    }
    return rec;
  }
}
