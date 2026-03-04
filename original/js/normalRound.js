import { RoundManager } from './roundManager.js';

export class NormalRound extends RoundManager {
  constructor(nextRoundScore, skyColor, groundColor, interval) {
    super(nextRoundScore, skyColor, groundColor);
    this.interval = interval;
    this.counter = 0;
  }

  generateObstacle(obstacles, recorder) {
    this.gameTime++;
    this.counter++;
    if (this.counter >= this.interval) {
      this.counter = 0;
      const ob = this.createObstacleRandom(recorder);
      obstacles.add(ob);
    }
  }

  init() {
    this.counter = 0;
    this.gameTime = 0;
  }
}
