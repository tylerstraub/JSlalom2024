import java.awt.Color;
import java.awt.Graphics;

public class Obstacle extends DrawObject {
   DPoint3[] points = new DPoint3[]{new DPoint3(), new DPoint3(), new DPoint3(), new DPoint3()};
   Face[] faces = new Face[]{new Face(), new Face(), new Face()};
   Obstacle next = null;
   Obstacle prev = null;
   Color color;
   private static Obstacle head = null;

   static synchronized void releaseObstacle(Obstacle var0) {
      if (var0 != null) {
         var0.next = head;
         head = var0;
      }
   }

   void release() {
      this.prev.next = this.next;
      this.next.prev = this.prev;
      releaseObstacle(this);
   }

   void draw(Graphics var1, DrawEnv var2) {
      var2.drawPolygon(var1, this.faces[0]);
      var2.drawPolygon(var1, this.faces[1]);
   }

   Obstacle() {
      this.faces[0].points = new DPoint3[]{this.points[3], this.points[0], this.points[1]};
      this.faces[0].numPoints = 3;
      this.faces[1].points = new DPoint3[]{this.points[3], this.points[2], this.points[1]};
      this.faces[1].numPoints = 3;
   }

   static {
      int var0 = 0;

      do {
         Obstacle var1 = new Obstacle();
         var1.next = head;
         head = var1;
         ++var0;
      } while(var0 < 16);

   }

   static synchronized Obstacle newObstacle() {
      Obstacle var0 = head;
      if (var0 == null) {
         var0 = new Obstacle();
      } else {
         head = head.next;
      }

      var0.next = null;
      return var0;
   }

   void prepareNewObstacle() {
      this.faces[0].setColor(this.color.brighter());
      this.faces[0].calcMaxZ();
      this.faces[1].setColor(this.color);
      this.faces[1].calcMaxZ();
   }

   void move(double var1, double var3, double var5) {
      int var7 = 0;

      do {
         DPoint3 var8 = this.points[var7];
         var8.x += var1;
         var8.y += var3;
         var8.z += var5;
         ++var7;
      } while(var7 < 4);

   }
}
