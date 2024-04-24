import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public class GameRecorder {
   public static final int LEFT = 1;
   public static final int RIGHT = 2;
   private RandomGenerator random;
   private int seed = (int)System.currentTimeMillis();
   private int[] data = new int[2048];
   private int pos;
   private int maxpos = 0;
   public int startScore;
   public int startRound;

   public void writeStatus(int var1) {
      if (this.pos < this.data.length * 16) {
         int[] var10000 = this.data;
         int var10001 = this.pos / 16;
         var10000[var10001] |= var1 << this.pos % 16 * 2;
         ++this.pos;
         if (this.pos > this.maxpos) {
            this.maxpos = this.pos;
         }

      }
   }

   public int readStatus() {
      if (this.pos >= this.data.length * 16) {
         return 0;
      } else {
         int var1 = this.data[this.pos / 16] >>> this.pos % 16 * 2;
         ++this.pos;
         return var1 & 3;
      }
   }

   public GameRecorder() {
      this.random = new RandomGenerator(this.seed);
   }

   public void load(InputStream var1) throws IOException {
      DataInputStream var2 = new DataInputStream(var1);
      this.seed = var2.readInt();
      this.maxpos = var2.readInt();
      this.startRound = var2.readInt();
      this.startScore = var2.readInt();

      for(int var3 = 0; var3 < this.maxpos; ++var3) {
         this.data[var3] = var2.readInt();
      }

   }

   public void save(OutputStream var1) throws IOException {
      DataOutputStream var2 = new DataOutputStream(var1);
      var2.writeInt(this.seed);
      var2.writeInt(this.maxpos);
      var2.writeInt(this.startRound);
      var2.writeInt(this.startScore);

      for(int var3 = 0; var3 < this.maxpos; ++var3) {
         var2.writeInt(this.data[var3]);
      }

   }

   public int getRandom() {
      return this.random.nextInt() & Integer.MAX_VALUE;
   }

   public void toStart() {
      this.pos = 0;
      this.random.setSeed(this.seed);
   }
}
