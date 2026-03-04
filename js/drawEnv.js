// Remastered DrawEnv: Canvas 2D paths instead of pixel buffer
// _project scales from 320×200 virtual space to actual canvas dimensions
export class DrawEnv {
  constructor() {
    this.nowSin = 0;
    this.nowCos = 1;
    this.ctx = null;
    this.canvasW = 320;
    this.canvasH = 200;
  }

  // Called each frame before drawing to bind the current context + dimensions
  setCtx(ctx, w, h) {
    this.ctx = ctx;
    this.canvasW = w;
    this.canvasH = h;
  }

  // No-ops kept for API compatibility with the original
  initBuffer() {}
  flush() {}

  clearBuffer(r, g, b) {
    this.ctx.fillStyle = `rgb(${r},${g},${b})`;
    this.ctx.fillRect(0, 0, this.canvasW, this.canvasH);
  }

  // Project a 3D point → 2D canvas pixel, scaled to actual canvas size
  _project(p) {
    const scale = 120 / (1 + 0.6 * p.z);
    const rotX = this.nowCos * p.x + this.nowSin * (p.y - 2.0);
    const rotY = -this.nowSin * p.x + this.nowCos * (p.y - 2.0) + 2.0;
    const sx = this.canvasW / 320;
    const sy = this.canvasH / 200;
    return {
      x: (rotX * scale + 160) * sx,
      y: (rotY * scale + 100) * sy
    };
  }

  drawFace(face) {
    const pts = face.points;
    // Brightness from face normal cross-product magnitude (same math as original)
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
    this._fillPath(screenPts, r, g, b);
  }

  drawPolygon(color, points) {
    const n = points.length;
    const screenPts = new Array(n);
    for (let i = 0; i < n; i++) {
      screenPts[i] = this._project(points[i]);
    }
    this._fillPath(screenPts, color.r, color.g, color.b);
  }

  _fillPath(screenPts, r, g, b) {
    const ctx = this.ctx;
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.beginPath();
    ctx.moveTo(screenPts[0].x, screenPts[0].y);
    for (let i = 1; i < screenPts.length; i++) {
      ctx.lineTo(screenPts[i].x, screenPts[i].y);
    }
    ctx.closePath();
    ctx.fill();
  }
}
