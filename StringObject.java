import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics;

class StringObject extends DrawObject {
   private Graphics currentGra = null;
   private Font font;
   private String str;
   private Color color;
   private int x;
   private int y;
   boolean isUnderLine = false;
   private int strWidth;
   private int strHeight;
   private int align_ = 0;
   public static final int CENTER = 0;
   public static final int LEFT = 1;

   void draw(Graphics var1, DrawEnv var2) {
      if (this.str != null) {
         var1.setColor(this.color);
         var1.setFont(this.font);
         if (var1 != this.currentGra || this.strWidth < 0) {
            this.currentGra = var1;
            this.setStrSize();
         }

         int var3 = this.x;
         if (this.align_ == 0) {
            var3 = this.x - this.strWidth / 2;
         }

         var1.drawString(this.str, var3, this.y + this.strHeight / 2);
         if (this.isUnderLine) {
            var1.drawLine(var3, this.y + this.strHeight / 2 + 1, var3 + this.strWidth, this.y + this.strHeight / 2 + 1);
         }

      }
   }

   StringObject(Font var1, Color var2, String var3, int var4, int var5) {
      this.font = var1;
      this.str = var3;
      this.color = var2;
      this.x = var4;
      this.y = var5;
      this.strWidth = -1;
   }

   void setColor(Color var1) {
      this.color = var1;
   }

   void setAlign(int var1) {
      this.align_ = var1;
   }

   int getAlign() {
      return this.align_;
   }

   boolean hitTest(int var1, int var2) {
      if (this.currentGra == null) {
         return false;
      } else {
         return this.x - this.strWidth / 2 < var1 && var1 < this.x + this.strWidth / 2 && this.y - this.strHeight / 2 < var2 && var2 < this.y + this.strHeight / 2;
      }
   }

   private void setStrSize() {
      FontMetrics var1 = this.currentGra.getFontMetrics();
      this.strWidth = var1.stringWidth(this.str);
      this.strHeight = var1.getHeight();
   }

   void setText(String var1) {
      if (var1 != this.str) {
         if (var1 == null || !var1.equals(this.str)) {
            this.str = var1;
            this.strWidth = -1;
         }
      }
   }
}
