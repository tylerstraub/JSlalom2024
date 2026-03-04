export const ALIGN_CENTER = 0;
export const ALIGN_LEFT = 1;

export class StringObject {
  constructor(font, color, str, x, y) {
    this.font = font;       // CSS font string
    this.color = color;     // CSS color string
    this.str = str;
    this.x = x;
    this.y = y;
    this.isUnderLine = false;
    this.align = ALIGN_CENTER;
    this._strWidth = -1;
    this._strHeight = -1;
  }

  draw(ctx) {
    if (this.str === null) return;
    ctx.fillStyle = this.color;
    ctx.font = this.font;

    // Measure text if needed
    if (this._strWidth < 0) {
      const metrics = ctx.measureText(this.str);
      this._strWidth = metrics.width;
      this._strHeight = parseInt(this.font) || 12;
    }

    let drawX = this.x;
    if (this.align === ALIGN_CENTER) {
      drawX = this.x - this._strWidth / 2;
    }

    ctx.textBaseline = 'middle';
    ctx.fillText(this.str, drawX, this.y);

    if (this.isUnderLine) {
      const lineY = this.y + this._strHeight / 2 + 1;
      ctx.beginPath();
      ctx.moveTo(drawX, lineY);
      ctx.lineTo(drawX + this._strWidth, lineY);
      ctx.strokeStyle = this.color;
      ctx.stroke();
    }
  }

  hitTest(mx, my) {
    if (this._strWidth < 0) return false;
    return (this.x - this._strWidth / 2 < mx && mx < this.x + this._strWidth / 2 &&
            this.y - this._strHeight / 2 < my && my < this.y + this._strHeight / 2);
  }

  setText(str) {
    if (str !== this.str) {
      this.str = str;
      this._strWidth = -1;
    }
  }

  setColor(color) {
    this.color = color;
  }

  setAlign(align) {
    this.align = align;
  }
}
