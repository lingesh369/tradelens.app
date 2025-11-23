
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';
import { useAdminMediaQuery } from '@/hooks/use-admin-media-query';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, isAdmin, isManager, isLoading, isRoleLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isMobile, isTablet, useCollapsibleBehavior } = useAdminMediaQuery();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('adminSidebarCollapsed');
    return saved === 'true';
  });
  
  console.log("AdminLayout rendering with:", { 
    isLoading, 
    isRoleLoading,
    isAdmin, 
    isManager, 
    hasUser: !!user
  });

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  // Memoize toast messages to prevent recreation
  const showAuthError = useCallback(() => {
    toast({
      title: "Authentication Required",
      description: "Please log in to access the admin area",
      variant: "destructive",
    });
  }, [toast]);

  const showAccessError = useCallback(() => {
    toast({
      title: "Access Restricted", 
      description: "You don't have permission to access the admin area.",
      variant: "destructive",
    });
  }, [toast]);

  // Use effect for redirection after roles are loaded
  useEffect(() => {
    // Only check roles after both auth and roles are loaded
    if (!isLoading && !isRoleLoading) {
      // User must be logged in and have admin/manager role
      if (!user) {
        console.log("No user in AdminLayout, redirecting to auth");
        showAuthError();
        navigate('/auth');
        return;
      } 
      
      if (!isAdmin && !isManager) {
        console.log("User doesn't have admin/manager role, redirecting to home");
        showAccessError();
        navigate('/');
        return;
      }
    }
  }, [user, isAdmin, isManager, isLoading, isRoleLoading, navigate, showAuthError, showAccessError]);

  // Memoize callback functions to prevent unnecessary re-renders
  const handleMobileMenuToggle = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  const handleMobileMenuClose = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  // Memoize sidebar width calculation
  const sidebarWidth = useMemo(() => {
    return useCollapsibleBehavior ? '280px' : (sidebarCollapsed ? '60px' : '240px');
  }, [useCollapsibleBehavior, sidebarCollapsed]);

  // Show loading state if either authentication or role information is loading
  if (isLoading || isRoleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-foreground">Loading admin panel...</span>
      </div>
    );
  }

  // If not loading but user doesn't have proper access, return null (redirect handled in useEffect)
  if (!user || (!isAdmin && !isManager)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-foreground">Checking access permissions...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <div className="flex w-full max-w-full">
        <AdminSidebar 
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          mobileOpen={mobileMenuOpen}
          onMobileOpenChange={setMobileMenuOpen}
        />
        
        <div className={cn(
          "flex-1 transition-all duration-300 flex flex-col h-screen min-w-0",
          useCollapsibleBehavior ? "ml-0" : (sidebarCollapsed ? "ml-[60px]" : "ml-[240px]")
        )}>
          <AdminTopBar 
            onMobileMenuClick={handleMobileMenuToggle}
            showMobileMenu={useCollapsibleBehavior}
            sidebarCollapsed={sidebarCollapsed}
            onSidebarToggle={handleSidebarToggle}
          />
          <main className="flex-1 p-2 sm:p-4 lg:p-6 overflow-y-auto overflow-x-hidden max-w-full">
            <div className="w-full max-w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
