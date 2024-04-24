import java.applet.AudioClip;
import java.awt.Canvas;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.Graphics;
import java.awt.Image;
import java.awt.MediaTracker;
import java.awt.event.KeyEvent;
import java.awt.event.KeyListener;
import java.awt.event.MouseEvent;
import java.awt.event.MouseListener;
import java.awt.event.MouseMotionListener;
import java.awt.image.ImageObserver;
import java.net.MalformedURLException;
import java.net.URL;

class MainGame extends Canvas implements Runnable, MouseListener, MouseMotionListener, KeyListener {
   static double[] si = new double[128];
   static double[] co = new double[128];
   DrawEnv env = new DrawEnv();
   Ground ground = new Ground();
   TimerNotifier timer;
   GameRecorder recorder = new GameRecorder();
   GameRecorder hiscoreRec = null;
   ObstacleCollection obstacles = new ObstacleCollection();
   double vx = 0.0D;
   double mywidth = 0.7D;
   int mywidth2;
   int score;
   int prevScore;
   int hiscore;
   int shipCounter;
   int contNum;
   private String[] strHiScoreInfo_;
   int gameMode = 2;
   static final int PLAY_MODE = 0;
   static final int TITLE_MODE = 1;
   static final int DEMO_MODE = 2;
   boolean isContinue = false;
   boolean registMode = false;
   int width;
   int height;
   int centerX;
   int centerY;
   int mouseX = 0;
   int mouseY = 0;
   boolean isInPage = false;
   Thread gameThread;
   Image img;
   Image myImg;
   Image myImg2;
   Image myRealImg;
   Image myRealImg2;
   Graphics gra;
   Graphics thisGra;
   MediaTracker tracker;
   AudioClip auBomb = null;
   boolean isLoaded = false;
   int round;
   RoundManager[] rounds;
   boolean rFlag;
   boolean lFlag;
   boolean spcFlag;
   Game3D parent;
   boolean isFocus;
   boolean isFocus2;
   boolean scFlag;
   Font titleFont;
   Font normalFont;
   StringObject title;
   StringObject author;
   StringObject startMsg;
   StringObject contMsg;
   StringObject clickMsg;
   StringObject hpage;
   int damaged;
   private char[] memInfo;
   private Runtime runtime;
   private int titleCounter_;
   private StringObject[] hiScoreInfoObj;

   public void stop() {
      if (this.gameThread != null) {
         this.gameThread.stop();
      }

      this.gameThread = null;
      this.registMode = false;
      this.gameMode = 1;
      this.timer.interrupt();
   }

   void keyEvent(int var1, boolean var2) {
      if (var1 == 39 || var1 == 76) {
         this.rFlag = var2;
      }

      if (var1 == 37 || var1 == 74) {
         this.lFlag = var2;
      }

      if (var1 == 65) {
         this.spcFlag = var2;
      }

      if (var2) {
         if (var1 == 71) {
            System.gc();
         }

         if (this.gameMode != 0 && (var1 == 32 || var1 == 67)) {
            this.startGame(0, var1 == 67);
         }

         if (this.gameMode == 1 && var1 == 68 && this.hiscoreRec != null) {
            this.startGame(2, false);
         }

         if (this.gameMode != 0 && var1 == 84) {
            this.prevScore = 110000;
            this.contNum = 100;
            this.startGame(0, true);
         }

      }
   }

   void keyOperate() {
      boolean var1 = this.rFlag;
      boolean var2 = this.lFlag;
      int var3;
      if (this.gameMode == 0) {
         var3 = 0;
         if (var1) {
            var3 |= 2;
         }

         if (var2) {
            var3 |= 1;
         }

         this.recorder.writeStatus(var3);
      } else if (this.gameMode == 2) {
         var3 = this.hiscoreRec.readStatus();
         var1 = (var3 & 2) != 0;
         var2 = (var3 & 1) != 0;
      }

      if (this.damaged == 0 && (this.gameMode == 0 || this.gameMode == 2)) {
         if (var1) {
            this.vx -= 0.1D;
         }

         if (var2) {
            this.vx += 0.1D;
         }

         if (this.vx < -0.6D) {
            this.vx = -0.6D;
         }

         if (this.vx > 0.6D) {
            this.vx = 0.6D;
         }
      }

      if (!var2 && !var1) {
         if (this.vx < 0.0D) {
            this.vx += 0.025D;
            if (this.vx > 0.0D) {
               this.vx = 0.0D;
            }
         }

         if (this.vx > 0.0D) {
            this.vx -= 0.025D;
            if (this.vx < 0.0D) {
               this.vx = 0.0D;
            }
         }
      }

   }

   public void mouseReleased(MouseEvent var1) {
      this.rFlag = false;
      this.lFlag = false;
   }

   public void keyPressed(KeyEvent var1) {
      this.keyEvent(var1.getKeyCode(), true);
   }

   void moveObstacle() {
      GameRecorder var4 = this.recorder;
      if (this.gameMode == 2) {
         var4 = this.hiscoreRec;
      }

      int var3 = (int)(Math.abs(this.vx) * 100.0D);
      this.env.nowSin = si[var3];
      this.env.nowCos = co[var3];
      if (this.vx > 0.0D) {
         this.env.nowSin = -this.env.nowSin;
      }

      Obstacle var2;
      for(Obstacle var1 = this.obstacles.head.next; var1 != this.obstacles.tail; var1 = var2) {
         var2 = var1.next;
         var1.move(this.vx, 0.0D, -1.0D);
         DPoint3[] var5 = var1.points;
         if (var5[0].z <= 1.1D) {
            double var6 = this.mywidth * this.env.nowCos;
            if (-var6 < var5[2].x && var5[0].x < var6) {
               ++this.damaged;
            }

            var1.release();
         }
      }

      this.rounds[this.round].move(this.vx);
      this.rounds[this.round].generateObstacle(this.obstacles, var4);
   }

   private void updateHiScoreInfoObj(int var1) {
      int var2 = 0;

      do {
         String var3 = " " + (var1 + var2 + 1);
         var3 = var3.substring(var3.length() - 2);
         this.hiScoreInfoObj[var2 + 1].setText(var3 + ".  " + this.strHiScoreInfo_[var1 + var2]);
         ++var2;
      } while(var2 < 5);

   }

   public void mouseEntered(MouseEvent var1) {
   }

   public void mouseExited(MouseEvent var1) {
   }

   public void start() {
      this.timer = new TimerNotifier(55);
      this.gameThread = new Thread(this);
      this.gameThread.start();
   }

   private void showTitle() {
      this.vx = 0.0D;
      byte var1 = 100;
      if (this.titleCounter_ >= var1 && this.strHiScoreInfo_ != null) {
         int var2 = (this.titleCounter_ - var1) / var1 * 5;
         if (var2 > 15) {
            var2 = 15;
            this.titleCounter_ = 0;
         }

         if (this.hiScoreInfoObj == null) {
            this.initHiScoreInfoObj();
         }

         this.updateHiScoreInfoObj(var2);
         int var3 = 0;

         do {
            this.hiScoreInfoObj[var3].draw(this.gra, (DrawEnv)null);
            ++var3;
         } while(var3 < 6);
      } else {
         this.title.draw(this.gra, (DrawEnv)null);
         this.startMsg.draw(this.gra, (DrawEnv)null);
         this.author.draw(this.gra, (DrawEnv)null);
         if (this.hpage.hitTest(this.mouseX, this.mouseY)) {
            this.hpage.setColor(Color.white);
            this.isInPage = true;
         } else {
            this.isInPage = false;
            this.hpage.setColor(Color.black);
         }

         this.hpage.draw(this.gra, (DrawEnv)null);
         if (this.rounds[0].isNextRound(this.prevScore)) {
            this.contMsg.draw(this.gra, (DrawEnv)null);
         }
      }

      ++this.titleCounter_;
      if (!this.isFocus) {
         this.clickMsg.draw(this.gra, (DrawEnv)null);
      }

   }

   public void startGame(int var1, boolean var2) {
      if (this.gameMode != 0) {
         this.vx = 0.0D;
         if (var1 != 0 && var1 != 2) {
            this.gameMode = 1;
         } else {
            if (var1 == 2 && this.hiscoreRec == null) {
               return;
            }

            this.gameMode = var1;
            if (var1 == 0) {
               this.recorder = new GameRecorder();
            } else {
               this.hiscoreRec.toStart();
            }
         }

         this.obstacles.removeAll();

         for(int var3 = 0; var3 < this.rounds.length; ++var3) {
            this.rounds[var3].init();
         }

         this.damaged = 0;
         this.round = 0;
         this.score = 0;
         this.vx = 0.0D;
         if (!var2) {
            this.contNum = 0;
         } else {
            while(this.prevScore >= this.rounds[this.round].getNextRoundScore()) {
               ++this.round;
            }

            if (this.round > 0) {
               this.score = this.rounds[this.round - 1].getNextRoundScore();
               ++this.contNum;
            }
         }

         if (var1 == 2) {
            this.round = this.hiscoreRec.startRound;
            this.score = this.hiscoreRec.startScore;
         } else {
            this.recorder.startRound = this.round;
            this.recorder.startScore = this.score;
         }

         this.parent.lblContinue.setText("" + this.contNum * 1000);
      }
   }

   void prt() {
      this.gra.setColor(this.rounds[this.round].getSkyColor());
      this.gra.fillRect(0, 0, this.width, this.height);
      if (this.gameMode == 0) {
         this.score += 20;
         if (this.scFlag) {
            this.parent.scoreWin.setNum(this.score);
         }
      }

      this.scFlag = !this.scFlag;
      this.ground.color = this.rounds[this.round].getGroundColor();
      this.ground.draw(this.gra, this.env);
      this.obstacles.draw(this.gra, this.env);
      ++this.shipCounter;
      if (this.gameMode != 1) {
         int var2 = 24 * this.height / 200;
         Image var1 = this.myRealImg;
         if (this.shipCounter % 4 > 1) {
            var1 = this.myRealImg2;
         }

         if (this.shipCounter % 12 > 6) {
            var2 = 22 * this.height / 200;
         }

         if (this.score < 200) {
            var2 = (12 + this.score / 20) * this.height / 200;
         }

         this.gra.drawImage(var1, this.centerX - this.mywidth2, this.height - var2, (ImageObserver)null);
         if (this.damaged > 0) {
            this.putbomb();
         }
      }

      if (this.gameMode == 1) {
         this.showTitle();
      } else {
         this.titleCounter_ = 0;
      }
   }

   public void mouseClicked(MouseEvent var1) {
   }

   public void mousePressed(MouseEvent var1) {
      int var2 = var1.getModifiers();
      if ((var2 & 4) != 0) {
         this.rFlag = true;
         this.lFlag = false;
      } else if ((var2 & 16) != 0) {
         this.rFlag = false;
         this.lFlag = true;
      }

      if (this.gameMode != 0) {
         if (!this.isFocus2) {
            this.isFocus2 = true;
         } else if (this.isInPage && this.gameMode == 1) {
            try {
               this.parent.getAppletContext().showDocument(new URL("http://www.kdn.gr.jp/~shii/"));
            } catch (MalformedURLException var3) {
            }
         } else {
            this.startGame(0, false);
         }
      }
   }

   public void mouseDragged(MouseEvent var1) {
   }

   public MainGame(Game3D var1) {
      this.rounds = new RoundManager[]{new NormalRound(8000, new Color(0, 160, 255), new Color(0, 200, 64), 4), new NormalRound(12000, new Color(240, 160, 160), new Color(64, 180, 64), 3), new NormalRound(25000, Color.black, new Color(0, 128, 64), 2), new RoadRound(40000, new Color(0, 180, 240), new Color(0, 200, 64), false), new RoadRound(100000, Color.lightGray, new Color(64, 180, 64), true), new NormalRound(1000000, Color.black, new Color(0, 128, 64), 1)};
      this.rFlag = false;
      this.lFlag = false;
      this.spcFlag = false;
      this.isFocus = true;
      this.isFocus2 = true;
      this.scFlag = true;
      this.memInfo = new char[8];
      this.runtime = Runtime.getRuntime();
      this.parent = var1;
      this.addKeyListener(this);
      this.addMouseListener(this);
      this.addMouseMotionListener(this);

      for(int var2 = 1; var2 < this.rounds.length; ++var2) {
         this.rounds[var2].setPrevRound(this.rounds[var2 - 1]);
      }

   }

   public void mouseMoved(MouseEvent var1) {
      this.mouseX = var1.getX();
      this.mouseY = var1.getY();
   }

   public void keyTyped(KeyEvent var1) {
   }

   public void paint(Graphics var1) {
      if (this.registMode) {
         var1.setColor(Color.lightGray);
         var1.fill3DRect(0, 0, this.width, this.height, true);
         var1.setColor(Color.black);
         var1.drawString("Wait a moment!!", this.centerX - 32, this.centerY + 8);
      } else {
         if (this.img != null) {
            var1.drawImage(this.img, 0, 0, this);
         }

      }
   }

   public synchronized void setHiScoreInfo(String[] var1) {
      this.strHiScoreInfo_ = var1;
   }

   private void drawMemInfo(Graphics var1) {
      int var2 = (int)this.runtime.freeMemory();
      int var3 = 7;

      do {
         int var4 = var2 % 10;
         var2 /= 10;
         this.memInfo[var3] = (char)(48 + var4);
         --var3;
      } while(var3 >= 0);

      var1.setColor(Color.red);
      var1.drawChars(this.memInfo, 0, 8, 0, 32);
   }

   public int getHiScore() {
      return this.hiscore;
   }

   void putExtra() {
   }

   void putbomb() {
      if (this.damaged > 20) {
         this.endGame();
      } else {
         if (this.damaged == 1 && this.auBomb != null) {
            this.auBomb.play();
         }

         this.gra.setColor(new Color(255, 255 - this.damaged * 12, 240 - this.damaged * 12));
         int var1 = this.damaged * 8 * this.width / 320;
         int var2 = this.damaged * 4 * this.height / 200;
         this.gra.fillOval(this.centerX - var1, 186 * this.height / 200 - var2, var1 * 2, var2 * 2);
         ++this.damaged;
      }
   }

   private Image loadImage(String var1) {
      Image var2;
      if (Game3D.isLocal) {
         var2 = this.getToolkit().getImage(ClassLoader.getSystemResource(var1));
      } else {
         var2 = this.parent.getImage(this.parent.getCodeBase(), var1);
      }

      this.tracker.addImage(var2, 0);
      return var2;
   }

   public void keyReleased(KeyEvent var1) {
      this.keyEvent(var1.getKeyCode(), false);
   }

   public Dimension getPreferredSize() {
      return new Dimension(this.width, this.height);
   }

   private void initHiScoreInfoObj() {
      this.hiScoreInfoObj = new StringObject[6];
      this.hiScoreInfoObj[0] = new StringObject(this.normalFont, Color.white, "Ranking", this.width / 2, 24);
      int var1 = 1;

      do {
         this.hiScoreInfoObj[var1] = new StringObject(this.normalFont, Color.white, "", this.width / 8, 24 + 24 * var1);
         this.hiScoreInfoObj[var1].setAlign(1);
         ++var1;
      } while(var1 < 6);

   }

   public void run() {
      this.thisGra = this.getGraphics();
      this.obstacles.removeAll();

      for(int var1 = 0; var1 < this.rounds.length; ++var1) {
         this.rounds[var1].init();
      }

      this.damaged = 0;
      this.round = 0;
      this.score = 0;
      this.vx = 0.0D;
      this.gameMode = 1;

      while(true) {
         if (this.rounds[this.round].isNextRound(this.score)) {
            ++this.round;
         }

         this.keyOperate();
         this.moveObstacle();
         this.prt();
         this.putExtra();
         this.thisGra.drawImage(this.img, 0, 0, (ImageObserver)null);
         this.getToolkit().sync();
         if (!this.spcFlag) {
            this.timer.wait1step();
         }
      }
   }

   public void init() {
      this.width = 320;
      this.height = 200;
      this.centerX = this.width / 2;
      this.centerY = this.height / 2;
      this.env.width = this.width;
      this.env.height = this.height;
      this.img = this.createImage(this.width, this.height);
      this.gra = this.img.getGraphics();
      this.gra.setColor(new Color(0, 128, 128));
      this.gra.fillRect(0, 0, this.width, this.height);
      int var1 = 0;

      do {
         si[var1] = Math.sin(3.141592653589793D * (double)var1 / 75.0D / 6.0D);
         co[var1] = Math.cos(3.141592653589793D * (double)var1 / 75.0D / 6.0D);
         ++var1;
      } while(var1 < 128);

      this.mywidth2 = (int)((double)this.width * this.mywidth * 120.0D / 1.6D / 320.0D);
      if (!Game3D.isLocal) {
         this.auBomb = this.parent.getAudioClip(this.parent.getCodeBase(), "bomb.au");
      }

      this.tracker = new MediaTracker(this.parent);
      this.myImg = this.loadImage("jiki.gif");
      this.myImg2 = this.loadImage("jiki2.gif");

      try {
         this.tracker.waitForAll();
      } catch (InterruptedException var2) {
      }

      this.myRealImg = this.myImg.getScaledInstance(this.mywidth2 * 2, this.mywidth2 * 16 / 52, 4);
      this.myRealImg2 = this.myImg2.getScaledInstance(this.mywidth2 * 2, this.mywidth2 * 16 / 52, 4);
      this.titleFont = new Font("TimesRoman", 1, this.width * 32 / 320 + 4);
      this.normalFont = new Font("Courier", 0, 12);
      this.title = new StringObject(this.titleFont, Color.white, "Jet slalom", this.width / 2, this.centerY - 20 * this.width / 320);
      this.author = new StringObject(this.normalFont, Color.black, "Programed by MR-C", this.centerX, this.centerY + 68);
      this.startMsg = new StringObject(this.normalFont, Color.black, this.parent.toStartMsg[this.parent.lang], this.centerX, this.centerY + 24);
      this.contMsg = new StringObject(this.normalFont, Color.black, this.parent.contMsg[this.parent.lang], this.centerX, this.centerY + 44);
      this.clickMsg = new StringObject(this.normalFont, Color.red, this.parent.clickMsg[this.parent.lang], this.centerX, this.centerY);
      this.hpage = new StringObject(this.normalFont, Color.black, "http://www.kdn.gr.jp/~shii/", this.centerX, this.centerY + 86);
   }

   void endGame() {
      this.parent.scoreWin.setNum(this.score);
      if (this.gameMode == 0) {
         this.prevScore = this.score;
      }

      if (this.score - this.contNum * 1000 > this.hiscore && this.gameMode == 0) {
         this.hiscore = this.score - this.contNum * 1000;
         this.hiscoreRec = this.recorder;
      }

      this.parent.hiScoreLabel.setText("Your Hi-score:" + this.hiscore);
      this.gameMode = 1;
      this.parent.endGame();
   }
}
