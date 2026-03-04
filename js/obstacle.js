import { DPoint3 } from './dpoint3.js';
import { Face } from './face.js';

// Object pool - free list
let poolHead = null;

export class Obstacle {
  constructor() {
    this.points = [new DPoint3(), new DPoint3(), new DPoint3(), new DPoint3()];
    this.faces = [new Face(), new Face(), new Face()];
    this.next = null;
    this.prev = null;
    this.color = null; // {r, g, b}

    // Face 0: points[3], points[0], points[1] (front/bright)
    this.faces[0].points = [this.points[3], this.points[0], this.points[1]];
    this.faces[0].numPoints = 3;
    // Face 1: points[3], points[2], points[1] (back/normal)
    this.faces[1].points = [this.points[3], this.points[2], this.points[1]];
    this.faces[1].numPoints = 3;
  }

  move(dx, dy, dz) {
    for (let i = 0; i < 4; i++) {
      this.points[i].x += dx;
      this.points[i].y += dy;
      this.points[i].z += dz;
    }
  }

  prepareNewObstacle() {
    // Front face gets brighter color — match Java's Color.brighter() exactly
    const c = this.color;
    let r = c.r, g = c.g, b = c.b;
    const i = 3; // (int)(1.0 / (1 - 0.7))
    if (r === 0 && g === 0 && b === 0) {
      r = i; g = i; b = i;
    } else {
      if (r > 0 && r < i) r = i;
      if (g > 0 && g < i) g = i;
      if (b > 0 && b < i) b = i;
    }
    const FACTOR = 0.7;
    const br = Math.min((r / FACTOR) | 0, 255);
    const bg = Math.min((g / FACTOR) | 0, 255);
    const bb = Math.min((b / FACTOR) | 0, 255);
    this.faces[0].setColor(br, bg, bb);
    this.faces[0].calcMaxZ();
    this.faces[1].setColor(c.r, c.g, c.b);
    this.faces[1].calcMaxZ();
  }

  draw(ctx, env) {
    env.drawFace(ctx, this.faces[0]);
    env.drawFace(ctx, this.faces[1]);
  }

  release() {
    // Remove from linked list
    this.prev.next = this.next;
    this.next.prev = this.prev;
    // Return to pool
    this.next = poolHead;
    poolHead = this;
  }

  static newObstacle() {
    let ob = poolHead;
    if (ob === null) {
      ob = new Obstacle();
    } else {
      poolHead = poolHead.next;
    }
    ob.next = null;
    return ob;
  }
}

// Pre-allocate 16 obstacles into pool
for (let i = 0; i < 16; i++) {
  const ob = new Obstacle();
  ob.next = poolHead;
  poolHead = ob;
}

export class ObstacleCollection {
  constructor() {
    this.head = new Obstacle();
    this.tail = new Obstacle();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  add(ob) {
    ob.prev = this.head;
    ob.next = this.head.next;
    this.head.next.prev = ob;
    this.head.next = ob;
  }

  removeAll() {
    let current = this.head.next;
    while (current !== this.tail) {
      const next = current.next;
      current.release();
      current = next;
    }
  }

  draw(ctx, env) {
    let current = this.head.next;
    while (current !== this.tail) {
      current.draw(ctx, env);
      current = current.next;
    }
  }
}
