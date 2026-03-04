import java.awt.Graphics;

public class ObstacleCollection {
   Obstacle head = new Obstacle();
   Obstacle tail = new Obstacle();

   synchronized void removeAll() {
      Obstacle var2;
      for(Obstacle var1 = this.head.next; var1 != this.tail; var1 = var2) {
         var2 = var1.next;
         var1.release();
      }

   }

   synchronized void draw(Graphics var1, DrawEnv var2) {
      for(Obstacle var3 = this.head.next; var3 != this.tail; var3 = var3.next) {
         var3.draw(var1, var2);
      }

   }

   ObstacleCollection() {
      this.head.next = this.tail;
      this.tail.prev = this.head;
   }

   synchronized void add(Obstacle var1) {
      var1.prev = this.head;
      var1.next = this.head.next;
      this.head.next.prev = var1;
      this.head.next = var1;
   }
}
