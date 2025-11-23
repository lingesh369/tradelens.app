
import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext";
import { useMediaQuery } from "@/hooks/use-media-query";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showAccountSelector?: boolean;
  showTrialBanner?: boolean;
  fixedHeaderOnSmall?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = "Dashboard",
  showAccountSelector = false,
  showTrialBanner = true,
  fixedHeaderOnSmall = false
}) => {
  const isMobile = useIsMobile();
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { isAdmin } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleMobileMenuClick = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  // Show collapsible sidebar on mobile and tablet (below 1024px)
  const shouldShowCollapsibleSidebar = isMobile || isTablet || !isDesktop;
  
  // Use fixed header on small screens when requested
  const useFixedHeader = fixedHeaderOnSmall && shouldShowCollapsibleSidebar;

  return (
    <div className="min-h-screen flex w-full max-w-full overflow-x-hidden">
      {/* Sidebar - responsive positioning */}
      <Sidebar 
        mobileOpen={mobileSidebarOpen} 
        onMobileOpenChange={setMobileSidebarOpen}
        forceCollapsible={shouldShowCollapsibleSidebar}
      />
      
      {/* Main content area - ensure no horizontal overflow */}
      <div className={`flex-1 flex flex-col min-w-0 max-w-full ${
        shouldShowCollapsibleSidebar ? 'ml-0' : 'ml-[200px]'
      }`}>
        {/* Top bar - conditional sticky behavior */}
        <div className={useFixedHeader ? "fixed top-0 left-0 right-0 z-40 bg-background" : "sticky top-0 z-40 bg-background"}>
          <TopBar 
            title={title} 
            showAccountSelector={showAccountSelector}
            onMobileMenuClick={handleMobileMenuClick}
            showMobileMenu={shouldShowCollapsibleSidebar}
          />
        </div>
        
        {/* Main content - adjust padding for fixed header and mobile bottom nav */}
        <main className={`flex-1 overflow-auto bg-background min-w-0 max-w-full ${
          useFixedHeader 
            ? "pt-16" 
            : ""
        } ${
          isMobile ? "pb-20" : ""
        }`}>
          <div className="w-full max-w-full overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};
