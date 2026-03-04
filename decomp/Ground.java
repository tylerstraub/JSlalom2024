import java.awt.Color;
import java.awt.Graphics;

public class Ground extends DrawObject {
   DPoint3[] points = new DPoint3[]{new DPoint3(-100.0D, 2.0D, 28.0D), new DPoint3(-100.0D, 2.0D, 0.1D), new DPoint3(100.0D, 2.0D, 0.1D), new DPoint3(100.0D, 2.0D, 28.0D)};
   Color color;

   void draw(Graphics var1, DrawEnv var2) {
      var1.setColor(this.color);
      var2.drawPolygon(var1, this.points);
   }
}
