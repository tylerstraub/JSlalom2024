export class DrawEnv {
  constructor() {
    this.nowSin = 0;
    this.nowCos = 1;
    this.width = 320;
    this.height = 200;
    this.imageData = null;
    this.pixelBuffer = null;
  }

  initBuffer() {
    this.imageData = new ImageData(this.width, this.height);
    this.pixelBuffer = this.imageData.data;
  }

  clearBuffer(r, g, b) {
    const buf = this.pixelBuffer;
    const len = buf.length;
    for (let i = 0; i < len; i += 4) {
      buf[i]     = r;
      buf[i + 1] = g;
      buf[i + 2] = b;
      buf[i + 3] = 255;
    }
  }

  flush(ctx) {
    ctx.putImageData(this.imageData, 0, 0);
  }

  _project(p) {
    const scale = 120 / (1 + 0.6 * p.z);
    const rotX = this.nowCos * p.x + this.nowSin * (p.y - 2.0);
    const rotY = -this.nowSin * p.x + this.nowCos * (p.y - 2.0) + 2.0;
    return {
      x: ((rotX * scale) | 0) + 160,
      y: ((rotY * scale) | 0) + 100
    };
  }

  // Pixel-exact scanline fill — matches Java's fillPolygon behavior
  _fillPolygon(screenPts, r, g, b) {
    const buf = this.pixelBuffer;
    const W = this.width;
    const H = this.height;
    const n = screenPts.length;

    let yMin = H, yMax = -1;
    for (let i = 0; i < n; i++) {
      const y = screenPts[i].y;
      if (y < yMin) yMin = y;
      if (y > yMax) yMax = y;
    }
    yMin = Math.max(0, yMin | 0);
    yMax = Math.min(H - 1, yMax | 0);

    for (let y = yMin; y <= yMax; y++) {
      let xLeft = W, xRight = -1;
      for (let i = 0; i < n; i++) {
        const v1 = screenPts[i];
        const v2 = screenPts[(i + 1) % n];
        if (v1.y === v2.y) continue; // skip horizontal edges
        const yLo = v1.y < v2.y ? v1.y : v2.y;
        const yHi = v1.y < v2.y ? v2.y : v1.y;
        if (y >= yLo && y <= yHi) {
          const x = (v1.x + (y - v1.y) * (v2.x - v1.x) / (v2.y - v1.y)) | 0;
          if (x < xLeft) xLeft = x;
          if (x > xRight) xRight = x;
        }
      }
      xLeft = Math.max(0, xLeft);
      xRight = Math.min(W - 1, xRight);
      for (let x = xLeft; x <= xRight; x++) {
        const idx = (y * W + x) << 2;
        buf[idx]     = r;
        buf[idx + 1] = g;
        buf[idx + 2] = b;
        buf[idx + 3] = 255;
      }
    }
  }

  drawFace(face) {
    const pts = face.points;
    const dx1 = pts[1].x - pts[0].x;
    const dy1 = pts[1].y - pts[0].y;
    const dx2 = pts[2].x - pts[0].x;
    const dy2 = pts[2].y - pts[0].y;
    let brightness = Math.fround(Math.abs(dx1 * dy2 - dy1 * dx2) / face.maxZ);
    if (brightness > 1) brightness = 1;

    const r = Math.round(face.red * brightness * 255);
    const g = Math.round(face.green * brightness * 255);
    const b = Math.round(face.blue * brightness * 255);

    const n = face.numPoints;
    const screenPts = new Array(n);
    for (let i = 0; i < n; i++) {
      screenPts[i] = this._project(pts[i]);
    }
    this._fillPolygon(screenPts, r, g, b);
  }

  drawPolygon(color, points) {
    const n = points.length;
    const screenPts = new Array(n);
    for (let i = 0; i < n; i++) {
      screenPts[i] = this._project(points[i]);
    }
    this._fillPolygon(screenPts, color.r, color.g, color.b);
  }
}
