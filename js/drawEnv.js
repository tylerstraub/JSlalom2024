export class DrawEnv {
  constructor() {
    this.nowSin = 0;
    this.nowCos = 1;
    this.width = 320;
    this.height = 200;
  }

  drawFace(ctx, face) {
    const n = face.numPoints;
    const pts = face.points;

    // Lighting: cross product magnitude of first two edges / maxZ
    const dx1 = pts[1].x - pts[0].x;
    const dy1 = pts[1].y - pts[0].y;
    const dx2 = pts[2].x - pts[0].x;
    const dy2 = pts[2].y - pts[0].y;
    let brightness = Math.fround(Math.abs(dx1 * dy2 - dy1 * dx2) / face.maxZ);
    if (brightness > 1) brightness = 1;

    const r = Math.round(face.red * brightness * 255);
    const g = Math.round(face.green * brightness * 255);
    const b = Math.round(face.blue * brightness * 255);
    ctx.fillStyle = `rgb(${r},${g},${b})`;

    const scaleX = this.width / 320;
    const scaleY = this.height / 200;

    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      const scale = 120 / (1 + 0.6 * p.z);
      const rotX = this.nowCos * p.x + this.nowSin * (p.y - 2.0);
      const rotY = -this.nowSin * p.x + this.nowCos * (p.y - 2.0) + 2.0;
      const sx = ((rotX * scaleX * scale) | 0) + this.width / 2;
      const sy = ((rotY * scaleY * scale) | 0) + this.height / 2;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fill();
  }

  drawPolygon(ctx, points) {
    const n = points.length;
    const scaleX = this.width / 320;
    const scaleY = this.height / 200;

    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const p = points[i];
      const scale = 120 / (1 + 0.6 * p.z);
      const rotX = this.nowCos * p.x + this.nowSin * (p.y - 2.0);
      const rotY = -this.nowSin * p.x + this.nowCos * (p.y - 2.0) + 2.0;
      const sx = ((rotX * scaleX * scale) | 0) + this.width / 2;
      const sy = ((rotY * scaleY * scale) | 0) + this.height / 2;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fill();
  }
}
