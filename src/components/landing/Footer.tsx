
import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold">TradeLens</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Empowering traders with smart journaling and powerful analytics to improve your trading performance.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-muted-foreground hover:text-foreground">Home</Link></li>
              <li><Link to="/features" className="text-muted-foreground hover:text-foreground">Features</Link></li>
              <li><a href="https://peakify.store/tradelens-pricing/" className="text-muted-foreground hover:text-foreground">Pricing</a></li>
              <li><Link to="/settings" className="text-muted-foreground hover:text-foreground">Settings</Link></li>
              <li><Link to="/profile" className="text-muted-foreground hover:text-foreground">Profile</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground">Privacy Policy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground">Terms of Service</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground">Cookie Policy</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:support@tradelens.com" className="text-muted-foreground hover:text-foreground">support@tradelens.com</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} TradeLens. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
