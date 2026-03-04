export const ALIGN_CENTER = 0;
export const ALIGN_LEFT = 1;

export class StringObject {
  constructor(font, color, str, x, y) {
    this.font = font;
    this.color = color;
    this.str = str;
    this.x = x;
    this.y = y;
    this.isUnderLine = false;
    this.align = ALIGN_CENTER;
    this._strWidth = -1;
    this._strHeight = -1;
    this._fontSize = parseInt(font) || 12;
  }

  _measure(ctx) {
    ctx.font = this.font;
    const m = ctx.measureText(this.str);
    this._strWidth = m.width;
    // Match Java's FontMetrics.getHeight() = ascent + descent
    this._strHeight = (m.fontBoundingBoxAscent || 0) + (m.fontBoundingBoxDescent || 0)
                      || this._fontSize;
  }

  draw(ctx) {
    if (this.str === null) return;

    if (this._strWidth < 0) {
      this._measure(ctx);
    }

    let drawX = this.x;
    if (this.align === ALIGN_CENTER) {
      drawX = this.x - this._strWidth / 2;
    }

    // Match Java: drawString(str, x, this.y + strHeight/2) — baseline positioning
    const baselineY = this.y + this._strHeight / 2;

    ctx.fillStyle = this.color;
    ctx.font = this.font;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(this.str, drawX, baselineY);

    if (this.isUnderLine) {
      const lineY = Math.round(baselineY + 1);
      ctx.fillStyle = this.color;
      ctx.fillRect(Math.round(drawX), lineY, Math.ceil(this._strWidth), 1);
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
