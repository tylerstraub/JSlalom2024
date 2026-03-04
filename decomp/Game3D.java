import java.applet.Applet;
import java.awt.BorderLayout;
import java.awt.Button;
import java.awt.Color;
import java.awt.FlowLayout;
import java.awt.Label;
import java.awt.Panel;
import java.awt.TextField;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.TextEvent;
import java.awt.event.TextListener;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URL;
import java.util.Calendar;
import java.util.StringTokenizer;

public class Game3D extends Applet implements ActionListener, TextListener {
   static final boolean isFreeware = true;
   MainGame game;
   Label hiScoreLabel;
   Label lblContinue;
   NumberLabel scoreWin;
   static boolean isLocal = false;
   int lang = 0;
   String[] bt1 = new String[]{"Regist your Hi-score", "自分のハイスコアの登録"};
   String[] contMsg = new String[]{"Push [C] key to start from this stage!!", "途中から始める場合は [C]key を押して下さい!!"};
   String[] toStartMsg = new String[]{"Click this game screen or push [space] key!!", "クリックするか、[space]keyを押して下さい"};
   String[] clickMsg = new String[]{"Click!!", "クリックして下さい"};
   private String strSessionId_;
   private int sentScore_ = 0;
   private TextField txtName = new TextField("No name", 16);
   private Button btnInput = new Button("Ok");
   private boolean isModified_ = false;

   public void stop() {
      this.game.stop();
   }

   private void rankInit() {
      this.strSessionId_ = Long.toString(Calendar.getInstance().getTime().getTime());
   }

   private String decodeString(String var1) {
      if (var1.charAt(0) != 'Z') {
         return var1;
      } else {
         StringBuffer var3 = new StringBuffer();

         for(int var2 = 1; var2 < var1.length(); var2 += 4) {
            int var4 = Integer.parseInt(var1.substring(var2, var2 + 4), 16);
            var3.append((char)var4);
         }

         return var3.toString();
      }
   }

   private synchronized void sendScore(int var1, String var2) {
      if (this.sentScore_ < var1 || this.isModified_) {
         try {
            int var3 = var1 % 8191 + var1 % 237;
            System.out.println("...");
            String var4 = "regist.cgi?" + var1 + "+" + var3 + "+" + this.encodeString(var2) + "+" + this.strSessionId_;
            InputStream var5 = (new URL(this.getCodeBase(), var4)).openStream();
            BufferedReader var6 = new BufferedReader(new InputStreamReader(var5));
            String var7 = var6.readLine();
            System.out.println(var7);
            this.sentScore_ = var1;
         } catch (Exception var8) {
            System.out.println(var8);
         }

         this.loadRanking();
      }
   }

   public static void main(String[] var0) {
      isLocal = true;
      Game3D var1 = new Game3D();
      AppFrame var2 = new AppFrame(var1, "Jet slalom");
      var2.show();
      var2.setLayout(new BorderLayout());
      var2.add("Center", var1);
      var1.init();
      var2.validate();
      var2.pack();
      var1.start();
   }

   public void actionPerformed(ActionEvent var1) {
      this.sendScore(this.game.getHiScore(), this.txtName.getText());
      this.game.requestFocus();
   }

   public void start() {
      this.game.start();
      this.game.startGame(1, false);
   }

   public void init() {
      if (!isLocal) {
         String var1 = this.getParameter("LANG");
         if (!isLocal && var1 != null && var1.equals("JP")) {
            this.lang = 1;
         }
      }

      this.setLayout(new BorderLayout());
      this.setBackground(new Color(160, 208, 176));
      this.scoreWin = new NumberLabel(64, 12);
      this.lblContinue = new Label("            ");
      Panel var4 = new Panel(new FlowLayout(0, 5, 0));
      var4.setLayout(new FlowLayout());
      var4.add(new Label("Score:"));
      var4.add(this.scoreWin);
      var4.add(new Label("Continue penalty:"));
      var4.add(this.lblContinue);
      this.add("North", var4);
      this.hiScoreLabel = new Label("Your Hi-score:0         ");
      this.add("South", this.hiScoreLabel);
      this.game = new MainGame(this);
      this.add("Center", this.game);
      this.game.init();
      this.game.requestFocus();
      this.invalidate();
      this.validate();
   }

   public void textValueChanged(TextEvent var1) {
      this.isModified_ = true;
   }

   private synchronized void loadRanking() {
      String[] var1 = new String[20];
      int var2 = 0;

      do {
         var1[var2] = "";
         ++var2;
      } while(var2 < 20);

      try {
         InputStream var3 = (new URL(this.getCodeBase(), "rank.dat")).openStream();
         BufferedReader var4 = new BufferedReader(new InputStreamReader(var3));
         var2 = 0;

         do {
            String var5 = var4.readLine();
            if (var5 == null) {
               break;
            }

            StringTokenizer var6 = new StringTokenizer(var5, ",");
            String var7 = "000000 : ???";
            if (var6.hasMoreTokens()) {
               int var8 = Integer.parseInt(var6.nextToken());
               if (var6.hasMoreTokens()) {
                  String var9 = this.decodeString(var6.nextToken());
                  String var10 = "000000" + var8;
                  var10 = var10.substring(var10.length() - 6);
                  var7 = var10 + " : " + var9;
               }
            }

            var1[var2] = var7;
            ++var2;
         } while(var2 < 20);

         this.game.setHiScoreInfo(var1);
         System.out.println("Success to load hi-score list.");
      } catch (Exception var11) {
         System.out.println("Fail to load hi-score list.");
         var11.printStackTrace();
      }
   }

   private String encodeString(String var1) {
      StringBuffer var3 = new StringBuffer("Z");

      for(int var2 = 0; var2 < var1.length(); ++var2) {
         char var4 = var1.charAt(var2);
         String var5 = "0000" + Integer.toHexString(var4);
         var5 = var5.substring(var5.length() - 4);
         var3.append(var5);
      }

      return var3.toString();
   }

   public synchronized void endGame() {
      this.sendScore(this.game.getHiScore(), this.txtName.getText());
   }
}
