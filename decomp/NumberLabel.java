import java.awt.Canvas;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.Graphics;

public class NumberLabel extends Canvas {
   char[] data = new char[6];
   Graphics gra;
   int width;
   int height;

   public void setNum(int var1) {
      int var2 = 0;

      do {
         this.data[5 - var2] = (char)(var1 % 10 + 48);
         var1 /= 10;
         ++var2;
      } while(var2 < 6);

      if (this.gra == null) {
         this.gra = this.getGraphics();
      }

      this.gra.clearRect(0, 0, this.width, this.height);
      this.paint(this.gra);
   }

   public NumberLabel(int var1, int var2) {
      int var3 = 0;

      do {
         this.data[var3] = '0';
         ++var3;
      } while(var3 < 6);

      this.width = var1;
      this.height = var2;
      this.setSize(var1, var2);
   }

   public void paint(Graphics var1) {
      var1.setColor(Color.black);
      var1.drawChars(this.data, 0, 6, 4, this.height);
   }

   public Dimension getPreferredSize() {
      return new Dimension(this.width, this.height);
   }
}
