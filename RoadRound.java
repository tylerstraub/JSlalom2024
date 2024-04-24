import java.awt.Color;

public class RoadRound extends RoundManager {
   private double OX1;
   private double OX2;
   private double OVX;
   private double WX;
   private int direction;
   private int roadCounter;
   private boolean isBrokenRoad;

   public RoadRound(int var1, Color var2, Color var3, boolean var4) {
      super.nextRoundScore = var1;
      super.skyColor = var2;
      super.groundColor = var3;
      this.isBrokenRoad = var4;
   }

   public void generateObstacle(ObstacleCollection var1, GameRecorder var2) {
      ++super.gameTime;
      this.roadCounter += -1;
      double var3 = 1.1D;
      double var5;
      if (this.isBrokenRoad && this.roadCounter % 13 < 7) {
         var3 = 0.7D;
         var5 = (double)(var2.getRandom() % 256) / 8.0D - 16.0D;
         if (var5 < this.OX2 && var5 > this.OX1) {
            var3 = 1.2D;
            if (var2.getRandom() % 256 > 128) {
               var5 = this.OX1;
            } else {
               var5 = this.OX2;
            }
         }
      } else if (this.roadCounter % 2 == 0) {
         var5 = this.OX1;
      } else {
         var5 = this.OX2;
      }

      if (this.OX2 - this.OX1 > 9.0D) {
         this.OX1 += 0.6D;
         this.OX2 -= 0.6D;
         if (this.OX2 - this.OX1 > 10.0D) {
            var3 = 2.0D;
         }
      } else if (this.OX1 > 18.0D) {
         this.OX2 -= 0.6D;
         this.OX1 -= 0.6D;
      } else if (this.OX2 < -18.0D) {
         this.OX2 += 0.6D;
         this.OX1 += 0.6D;
      } else {
         if (this.roadCounter < 0) {
            this.direction = -this.direction;
            this.roadCounter += 2 * (var2.getRandom() % 8 + 4);
         }

         if (this.direction > 0) {
            this.OVX += 0.125D;
         } else {
            this.OVX -= 0.125D;
         }

         if (this.OVX > 0.7D) {
            this.OVX = 0.7D;
         }

         if (this.OVX < -0.7D) {
            this.OVX = -0.7D;
         }

         this.OX1 += this.OVX;
         this.OX2 += this.OVX;
      }

      Obstacle var7 = this.createObstacle(var2, var5, var3);
      var1.add(var7);
   }

   public void init() {
      this.OX1 = -17.0D;
      this.OX2 = 17.0D;
      this.OVX = 0.0D;
      this.roadCounter = 0;
      this.direction = 1;
      super.gameTime = 0;
   }

   public void move(double var1) {
      this.OX1 += var1;
      this.OX2 += var1;
   }
}
