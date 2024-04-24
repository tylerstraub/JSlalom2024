import java.awt.Color;
import java.awt.Graphics;

public class DrawEnv {
   static final double T = 0.6D;
   private int[] polyX = new int[8];
   private int[] polyY = new int[8];
   private DPoint3[] dp3 = new DPoint3[3];
   double nowSin;
   double nowCos;
   int width;
   int height;

   synchronized void drawPolygon(Graphics var1, Face var2) {
      int var3 = var2.numPoints;
      DPoint3[] var4 = var2.points;
      double var6 = var4[1].x - var4[0].x;
      double var8 = var4[1].y - var4[0].y;
      DPoint3 var10000 = var4[1];
      var10000 = var4[0];
      double var10 = var4[2].x - var4[0].x;
      double var12 = var4[2].y - var4[0].y;
      var10000 = var4[2];
      var10000 = var4[0];
      float var14 = (float)(Math.abs(var6 * var12 - var8 * var10) / var2.maxZ);
      var1.setColor(new Color(var2.red * var14, var2.green * var14, var2.blue * var14));
      double var15 = (double)this.width / 320.0D;
      double var17 = (double)this.height / 200.0D;

      for(int var5 = 0; var5 < var3; ++var5) {
         DPoint3 var19 = var4[var5];
         double var20 = 120.0D / (1.0D + 0.6D * var19.z);
         double var22 = this.nowCos * var19.x + this.nowSin * (var19.y - 2.0D);
         double var24 = -this.nowSin * var19.x + this.nowCos * (var19.y - 2.0D) + 2.0D;
         this.polyX[var5] = (int)(var22 * var15 * var20) + this.width / 2;
         this.polyY[var5] = (int)(var24 * var17 * var20) + this.height / 2;
      }

      var1.fillPolygon(this.polyX, this.polyY, var3);
   }

   synchronized void drawPolygon(Graphics var1, DPoint3[] var2) {
      int var3 = var2.length;
      double var5 = (double)this.width / 320.0D;
      double var7 = (double)this.height / 200.0D;

      for(int var4 = 0; var4 < var3; ++var4) {
         DPoint3 var9 = var2[var4];
         double var10 = 120.0D / (1.0D + 0.6D * var9.z);
         double var12 = this.nowCos * var9.x + this.nowSin * (var9.y - 2.0D);
         double var14 = -this.nowSin * var9.x + this.nowCos * (var9.y - 2.0D) + 2.0D;
         this.polyX[var4] = (int)(var12 * var5 * var10) + this.width / 2;
         this.polyY[var4] = (int)(var14 * var7 * var10) + this.height / 2;
      }

      var1.fillPolygon(this.polyX, this.polyY, var3);
   }
}
