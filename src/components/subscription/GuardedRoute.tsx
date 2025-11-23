
import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAccessControl } from "@/hooks/useAccessControl";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface GuardedRouteProps {
  requiresAuthentication?: boolean;
  requiresAdmin?: boolean;
  requiresManager?: boolean;
  requiresAdminOrManager?: boolean;
}

export const GuardedRoute: React.FC<GuardedRouteProps> = ({
  requiresAuthentication = true,
  requiresAdmin = false,
  requiresManager = false,
  requiresAdminOrManager = false,
}) => {
  const location = useLocation();
  const { user, isAdmin, isManager, isLoading: authLoading } = useAuth();
  const { access, isLoading: accessLoading } = useAccessControl();
  const { toast } = useToast();
  
  const isLoading = authLoading || accessLoading;

  useEffect(() => {
    if (isLoading) return;

    let message: string | null = null;
    if (requiresAdmin && !isAdmin && !access?.isAdmin) {
      message = "You don't have administrative privileges.";
    } else if (requiresManager && !isManager && !isAdmin && !access?.isAdmin) {
      message = "You don't have manager privileges.";
    } else if (requiresAdminOrManager && !isManager && !isAdmin && !access?.isAdmin) {
      message = "You don't have sufficient privileges to access this area.";
    }

    if (message) {
      toast({
        title: "Access Denied",
        description: message,
        variant: "destructive",
      });
    }
  }, [isLoading, isAdmin, isManager, access, requiresAdmin, requiresManager, requiresAdminOrManager, toast]);

  // Show loading indicator while checking
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Verifying access permissions...</span>
      </div>
    );
  }

  // Authentication check
  if (requiresAuthentication && !user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // Permission checks for navigation
  if (
    (requiresAdmin && !isAdmin && !access?.isAdmin) ||
    (requiresManager && !isManager && !isAdmin && !access?.isAdmin) ||
    (requiresAdminOrManager && !isManager && !isAdmin && !access?.isAdmin)
  ) {
    return <Navigate to="/" replace />;
  }

  // If access is blocked (expired plan), the AccessWrapper will handle it
  // We still allow the route to render so the blocking dialog can show
  return <Outlet />;
};
