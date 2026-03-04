import { DPoint3 } from './dpoint3.js';

export class Ground {
  constructor() {
    this.points = [
      new DPoint3(-100, 2, 28),
      new DPoint3(-100, 2, 0.1),
      new DPoint3(100, 2, 0.1),
      new DPoint3(100, 2, 28)
    ];
    this.color = null; // {r, g, b}
  }

  draw(ctx, env) {
    ctx.fillStyle = `rgb(${this.color.r},${this.color.g},${this.color.b})`;
    env.drawPolygon(ctx, this.points);
  }
}
