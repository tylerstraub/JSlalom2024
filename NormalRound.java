import java.awt.Color;

public class NormalRound extends RoundManager {
   private int interval;
   private int counter;

   public NormalRound(int var1, Color var2, Color var3, int var4) {
      super.nextRoundScore = var1;
      super.skyColor = var2;
      super.groundColor = var3;
      this.interval = var4;
   }

   public void generateObstacle(ObstacleCollection var1, GameRecorder var2) {
      ++super.gameTime;
      ++this.counter;
      if (this.counter >= this.interval) {
         this.counter = 0;
         Obstacle var3 = this.createObstacle(var2, 0.6D);
         var1.add(var3);
      }
   }

   public void init() {
      this.counter = 0;
      super.gameTime = 0;
   }
}
