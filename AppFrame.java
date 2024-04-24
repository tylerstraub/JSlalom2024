import java.applet.Applet;
import java.awt.Frame;
import java.awt.event.WindowEvent;
import java.awt.event.WindowListener;

public class AppFrame extends Frame implements WindowListener {
   Applet applet;

   public AppFrame(Applet var1, String var2) {
      super(var2);
      this.addWindowListener(this);
      this.applet = var1;
   }

   public void windowDeactivated(WindowEvent var1) {
   }

   public void windowClosing(WindowEvent var1) {
      this.applet.stop();
      System.exit(0);
   }

   public void windowOpened(WindowEvent var1) {
   }

   public void windowClosed(WindowEvent var1) {
   }

   public void windowDeiconified(WindowEvent var1) {
   }

   public void windowActivated(WindowEvent var1) {
   }

   public void windowIconified(WindowEvent var1) {
   }
}
