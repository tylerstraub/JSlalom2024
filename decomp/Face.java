import java.awt.Color;

public class Face {
   DPoint3[] points;
   int numPoints;
   double maxZ;
   float red;
   float green;
   float blue;

   void setColor(Color var1) {
      this.red = (float)var1.getRed() / 255.0F;
      this.green = (float)var1.getGreen() / 255.0F;
      this.blue = (float)var1.getBlue() / 255.0F;
   }

   void calcMaxZ() {
      double var1 = this.points[1].x - this.points[0].x;
      double var3 = this.points[1].y - this.points[0].y;
      double var5 = this.points[1].z - this.points[0].z;
      double var7 = this.points[2].x - this.points[0].x;
      double var9 = this.points[2].y - this.points[0].y;
      double var11 = this.points[2].z - this.points[0].z;
      this.maxZ = Math.sqrt(this.two(var3 * var11 - var5 * var9) + this.two(var1 * var11 - var5 * var7) + this.two(var1 * var9 - var3 * var7));
   }

   private final double two(double var1) {
      return var1 * var1;
   }
}
