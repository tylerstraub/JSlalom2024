public class RandomGenerator {
   private int seed;

   public RandomGenerator(int var1) {
      this.seed = var1;
   }

   public void setSeed(int var1) {
      this.seed = var1;
   }

   public int nextInt() {
      this.seed = this.seed * 1593227 + 13;
      return this.seed >>> 16;
   }
}
