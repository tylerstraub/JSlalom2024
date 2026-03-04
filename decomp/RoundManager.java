import java.awt.Color;

public abstract class RoundManager {
   private RoundManager prevRound;
   static final Color[] colors;
   protected int nextRoundScore;
   protected Color skyColor;
   protected Color groundColor;
   protected int gameTime;

   protected final Obstacle createObstacle(GameRecorder var1, double var2, double var4) {
      Obstacle var6 = Obstacle.newObstacle();
      DPoint3[] var7 = var6.points;
      var7[0].setXYZ(var2 - var4, 2.0D, 25.5D);
      var7[1].setXYZ(var2, -1.4D, 25.0D);
      var7[2].setXYZ(var2 + var4, 2.0D, 25.5D);
      var7[3].setXYZ(var2, 2.0D, 24.5D);
      var6.color = colors[var1.getRandom() % 4];
      var6.prepareNewObstacle();
      return var6;
   }

   protected final Obstacle createObstacle(GameRecorder var1, double var2) {
      double var4 = (double)(var1.getRandom() % 256) / 8.0D - 16.0D;
      return this.createObstacle(var1, var4, 0.6D);
   }

   public abstract void generateObstacle(ObstacleCollection var1, GameRecorder var2);

   public boolean isNextRound(int var1) {
      return var1 >= this.nextRoundScore;
   }

   public void setPrevRound(RoundManager var1) {
      this.prevRound = var1;
   }

   static {
      colors = new Color[]{Color.lightGray, new Color(96, 160, 240), new Color(200, 128, 0), new Color(240, 210, 100)};
   }

   public Color getGroundColor() {
      return this.groundColor;
   }

   public int getNextRoundScore() {
      return this.nextRoundScore;
   }

   public void init() {
   }

   public Color getSkyColor() {
      if (this.prevRound != null && this.gameTime <= 32) {
         int var1 = this.gameTime;
         int var2 = 32 - var1;
         Color var3 = this.prevRound.skyColor;
         int var4 = var3.getRed() * var2 + this.skyColor.getRed() * var1;
         int var5 = var3.getGreen() * var2 + this.skyColor.getGreen() * var1;
         int var6 = var3.getBlue() * var2 + this.skyColor.getBlue() * var1;
         return new Color(var4 / 32, var5 / 32, var6 / 32);
      } else {
         return this.skyColor;
      }
   }

   public void move(double var1) {
   }
}
