export class Face {
  constructor() {
    this.points = null;
    this.numPoints = 0;
    this.maxZ = 0;
    this.red = 0;
    this.green = 0;
    this.blue = 0;
  }

  setColor(r, g, b) {
    this.red = r / 255;
    this.green = g / 255;
    this.blue = b / 255;
  }

  calcMaxZ() {
    const p = this.points;
    const dx1 = p[1].x - p[0].x;
    const dy1 = p[1].y - p[0].y;
    const dz1 = p[1].z - p[0].z;
    const dx2 = p[2].x - p[0].x;
    const dy2 = p[2].y - p[0].y;
    const dz2 = p[2].z - p[0].z;
    const cx = dy1 * dz2 - dz1 * dy2;
    const cy = dx1 * dz2 - dz1 * dx2;
    const cz = dx1 * dy2 - dy1 * dx2;
    this.maxZ = Math.sqrt(cx * cx + cy * cy + cz * cz);
  }
}
