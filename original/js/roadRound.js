import { RoundManager } from './roundManager.js';

export class RoadRound extends RoundManager {
  constructor(nextRoundScore, skyColor, groundColor, isBrokenRoad) {
    super(nextRoundScore, skyColor, groundColor);
    this.isBrokenRoad = isBrokenRoad;
    this.OX1 = -17;
    this.OX2 = 17;
    this.OVX = 0;
    this.direction = 1;
    this.roadCounter = 0;
  }

  generateObstacle(obstacles, recorder) {
    this.gameTime++;
    this.roadCounter--;

    let width = 1.1;
    let x;

    if (this.isBrokenRoad && this.roadCounter % 13 < 7) {
      width = 0.7;
      x = (recorder.getRandom() % 256) / 8.0 - 16.0;
      if (x < this.OX2 && x > this.OX1) {
        width = 1.2;
        if (recorder.getRandom() % 256 > 128) {
          x = this.OX1;
        } else {
          x = this.OX2;
        }
      }
    } else if (this.roadCounter % 2 === 0) {
      x = this.OX1;
    } else {
      x = this.OX2;
    }

    if (this.OX2 - this.OX1 > 9.0) {
      this.OX1 += 0.6;
      this.OX2 -= 0.6;
      if (this.OX2 - this.OX1 > 10.0) {
        width = 2.0;
      }
    } else if (this.OX1 > 18.0) {
      this.OX2 -= 0.6;
      this.OX1 -= 0.6;
    } else if (this.OX2 < -18.0) {
      this.OX2 += 0.6;
      this.OX1 += 0.6;
    } else {
      if (this.roadCounter < 0) {
        this.direction = -this.direction;
        this.roadCounter += 2 * (recorder.getRandom() % 8 + 4);
      }

      if (this.direction > 0) {
        this.OVX += 0.125;
      } else {
        this.OVX -= 0.125;
      }

      if (this.OVX > 0.7) this.OVX = 0.7;
      if (this.OVX < -0.7) this.OVX = -0.7;

      this.OX1 += this.OVX;
      this.OX2 += this.OVX;
    }

    const ob = this.createObstacle(recorder, x, width);
    obstacles.add(ob);
  }

  init() {
    this.OX1 = -17;
    this.OX2 = 17;
    this.OVX = 0;
    this.roadCounter = 0;
    this.direction = 1;
    this.gameTime = 0;
  }

  move(vx) {
    this.OX1 += vx;
    this.OX2 += vx;
  }
}
