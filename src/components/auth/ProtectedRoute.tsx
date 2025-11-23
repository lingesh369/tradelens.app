
import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Only redirect if we're done loading, there's no user, and we haven't redirected yet
    if (!isLoading && !user && !hasRedirected) {
      console.log("Redirecting to auth page - no user found");
      setHasRedirected(true);
      toast({
        title: "Authentication required",
        description: "Please sign in to access this page",
        variant: "destructive",
      });
      navigate("/auth", { replace: true });
    }
  }, [user, isLoading, navigate, toast, hasRedirected]);

  // Force resolve loading state after 15 seconds
  useEffect(() => {
    if (isLoading) {
      const forceResolveTimeout = setTimeout(() => {
        console.warn("Forcing auth resolution due to timeout");
        if (!user) {
          navigate("/auth", { replace: true });
        }
      }, 15000);

      return () => clearTimeout(forceResolveTimeout);
    }
  }, [isLoading, user, navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <span className="mt-2 text-sm text-muted-foreground">Loading authentication...</span>
          <div className="mt-2 text-xs text-muted-foreground">
            If this takes too long, please refresh the page
          </div>
        </div>
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
