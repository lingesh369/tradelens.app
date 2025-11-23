
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const handleNavigateHome = () => {
    if (user) {
      navigate("/");
    } else {
      navigate("/home");
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      handleNavigateHome();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardContent className="text-center p-8">
          {/* Error Code */}
          <div className="text-6xl font-bold text-primary mb-4">
            404
          </div>
          
          {/* Error Message */}
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Page not found
          </h1>
          
          <p className="text-muted-foreground mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={handleNavigateHome}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              {user ? "Go to Dashboard" : "Go to Home"}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleGoBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>
          
          {/* Brand Touch */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-primary">TradeLens</span> - Track your trading journey
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
