import { Obstacle } from './obstacle.js';

// Obstacle colors matching the original
export const OBSTACLE_COLORS = [
  { r: 192, g: 192, b: 192 }, // lightGray
  { r: 96, g: 160, b: 240 },
  { r: 200, g: 128, b: 0 },
  { r: 240, g: 210, b: 100 }
];

export class RoundManager {
  constructor(nextRoundScore, skyColor, groundColor) {
    this.nextRoundScore = nextRoundScore;
    this.skyColor = skyColor;
    this.groundColor = groundColor;
    this.gameTime = 0;
    this.prevRound = null;
  }

  createObstacle(recorder, x, width) {
    const ob = Obstacle.newObstacle();
    const p = ob.points;
    p[0].setXYZ(x - width, 2.0, 25.5);
    p[1].setXYZ(x, -1.4, 25.0);
    p[2].setXYZ(x + width, 2.0, 25.5);
    p[3].setXYZ(x, 2.0, 24.5);
    ob.color = OBSTACLE_COLORS[recorder.getRandom() % 4];
    ob.prepareNewObstacle();
    return ob;
  }

  createObstacleRandom(recorder) {
    const x = (recorder.getRandom() % 256) / 8.0 - 16.0;
    return this.createObstacle(recorder, x, 0.6);
  }

  generateObstacle(obstacles, recorder) {
    // Abstract - override in subclasses
  }

  isNextRound(score) {
    return score >= this.nextRoundScore;
  }

  getNextRoundScore() {
    return this.nextRoundScore;
  }

  setPrevRound(prev) {
    this.prevRound = prev;
  }

  init() {
    // Override in subclasses
  }

  getGroundColor() {
    return this.groundColor;
  }

  getSkyColor() {
    if (this.prevRound !== null && this.gameTime <= 32) {
      const t = this.gameTime;
      const t2 = 32 - t;
      const prev = this.prevRound.skyColor;
      const r = ((prev.r * t2 + this.skyColor.r * t) / 32) | 0;
      const g = ((prev.g * t2 + this.skyColor.g * t) / 32) | 0;
      const b = ((prev.b * t2 + this.skyColor.b * t) / 32) | 0;
      return { r, g, b };
    }
    return this.skyColor;
  }

  move(vx) {
    // Override in subclasses if needed
  }
}
