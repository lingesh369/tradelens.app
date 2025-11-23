
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, Settings, User } from "lucide-react";

interface HeaderProps {
  activeSection: string;
}

const Header = ({ activeSection }: HeaderProps) => {
  return (
    <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">TradeLens</span>
        </div>
        
        <div className="flex items-center">
          <nav className="hidden md:flex items-center space-x-6 mr-6">
            <Link 
              to="/"
              className={`${activeSection === "home" ? "text-primary font-medium" : "text-muted-foreground"} hover:text-primary transition-colors`}
            >
              Home
            </Link>
            <Link 
              to="/features"
              className={`${activeSection === "features" ? "text-primary font-medium" : "text-muted-foreground"} hover:text-primary transition-colors`}
            >
              Features
            </Link>
            <a 
              href="https://peakify.store/tradelens-pricing/"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Pricing
            </a>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link to="/auth/sign-in">
              <Button variant="outline">Log In</Button>
            </Link>
            <Link to="/auth/register">
              <Button>Sign Up</Button>
            </Link>
            <Link to="/settings" className="hidden md:block">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/profile" className="hidden md:block">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
