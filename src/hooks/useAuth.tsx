
import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Only redirect if we're done loading and there's no user
    if (!isLoading && !user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to access this page",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [user, isLoading, navigate, toast]);

  // Recovery for stuck auth state
  useEffect(() => {
    if (isLoading && retryCount < 3) {
      const timer = setTimeout(() => {
        if (retryCount === 2) {
          // After 3 retries, redirect to auth page
          navigate("/auth");
        } else {
          setRetryCount(prev => prev + 1);
        }
      }, 5000); // Wait 5 seconds before checking
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, retryCount, navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading authentication...</span>
      </div>
    );
  }

  // If not loading and no user, return null (redirect will happen in useEffect)
  if (!user) {
    return null;
  }

  // User is authenticated, render the child routes
  return <Outlet />;
}
