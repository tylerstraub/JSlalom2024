public class TimerNotifier extends Thread {
   private volatile int interval;
   private volatile boolean notifyFlag = false;

   public TimerNotifier(int var1) {
      this.interval = var1;
      this.setName("TimerNotifier");
      System.out.println(10);
      this.setPriority(10);
      this.start();
   }

   public void setInterval(int var1) {
      this.interval = var1;
   }

   public synchronized void wait1step() {
      try {
         if (!this.notifyFlag) {
            this.wait();
         }
      } catch (InterruptedException var1) {
      }

      this.notifyFlag = false;
   }

   public void run() {
      while(true) {
         synchronized(this){}

         try {
            this.notifyFlag = true;
            this.notifyAll();
         } catch (Throwable var6) {
            throw var6;
         }

         try {
            Thread.sleep((long)this.interval);
         } catch (InterruptedException var5) {
            return;
         }
      }
   }
}
