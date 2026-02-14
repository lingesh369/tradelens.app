import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { AreaChart, BarChart4, BookOpen, Bot, CreditCard, FileText, HelpCircle, Home, ListOrdered, LogOut, PlusCircle, Settings, User, TrendingUp, X, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminNavDropdown } from "@/components/admin/AdminNavDropdown";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMediaQuery } from "@/hooks/use-media-query";
interface SidebarProps {
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
  forceCollapsible?: boolean;
}
export const Sidebar = ({
  mobileOpen = false,
  onMobileOpenChange,
  forceCollapsible = false
}: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    signOut,
    isAdmin,
    isManager
  } = useAuth();
  const isMobile = useIsMobile();
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // Early return if user is not authenticated
  if (!user) {
    return null;
  }

  // Handle sidebar item click - only close on mobile and tablet, not desktop
  const handleItemClick = () => {
    // Only close sidebar on mobile and tablet devices, not on desktop
    if ((isMobile || isTablet) && !isDesktop && onMobileOpenChange) {
      setTimeout(() => {
        onMobileOpenChange(false);
      }, 10);
    }
  };

  // Updated menu items - removed AI Assistant and added AI Co-Pilot
  const menuItems = [{
    path: "/",
    label: "Dashboard",
    icon: <Home className="h-5 w-5 text-foreground dark:text-white" />,
    restricted: false
  }, {
    path: "/trades",
    label: "Trades",
    icon: <ListOrdered className="h-5 w-5 text-foreground dark:text-white" />,
    restricted: false
  }, {
    path: "/journal",
    label: "Journal",
    icon: <BookOpen className="h-5 w-5 text-foreground dark:text-white" />,
    restricted: false
  }, {
    path: "/notes",
    label: "Notes",
    icon: <FileText className="h-5 w-5 text-foreground dark:text-white" />,
    restricted: false,
    adminOnly: true
  }, {
    path: "/strategies",
    label: "Strategies",
    icon: <BarChart4 className="h-5 w-5 text-foreground dark:text-white" />,
    restricted: false
  }, {
    path: "/analytics",
    label: "Analytics",
    icon: <AreaChart className="h-5 w-5 text-foreground dark:text-white" />,
    restricted: false
  }, {
    path: "/ai",
    label: "AI Co-Pilot",
    icon: <Bot className="h-5 w-5 text-foreground dark:text-white" />,
    restricted: false
  }, {
    divider: true
  }, {
    path: "/add-trade",
    label: "Add Trade",
    icon: <PlusCircle className="h-5 w-5 text-primary-foreground" />,
    special: true,
    restricted: false
  }, {
    divider: true
  }, {
    path: "/community",
    label: "Community",
    icon: <Users className="h-5 w-5 text-foreground dark:text-white" />,
    restricted: false
  }, {
    path: "/settings",
    label: "Settings",
    icon: <Settings className="h-5 w-5 text-foreground dark:text-white" />,
    restricted: false
  }, {
    path: "/profile",
    label: "Profile",
    icon: <User className="h-5 w-5 text-foreground dark:text-white" />,
    restricted: false
  }, {
    path: "/subscription",
    label: "Subscription",
    icon: <CreditCard className="h-5 w-5 text-foreground dark:text-white" />,
    restricted: false
  }, {
    path: "https://tradelens.featurebase.app/",
    label: "Support Hub",
    icon: <HelpCircle className="h-5 w-5 text-foreground dark:text-white" />,
    restricted: false,
    external: true
  }];

  // Filter menu items based on admin status
  const filteredMenuItems = menuItems.filter(item => {
    if (item.adminOnly && !isAdmin) {
      return false;
    }
    return true;
  });
  const isActiveRoute = (path: string) => {
    if (path === "/" && location.pathname === "/") {
      return true;
    }
    if (path === "/" && location.pathname === "/dashboard") {
      return true;
    }
    return location.pathname.startsWith(path) && path !== "/";
  };
  const handleAddTrade = () => {
    navigate("/add-trade");
    handleItemClick();
  };
  const handleSignOut = () => {
    signOut();
    handleItemClick();
  };
  const handleLinkClick = (path: string, external?: boolean) => {
    if (external) {
      window.open(path, '_blank', 'noopener,noreferrer');
    } else {
      navigate(path);
    }
    handleItemClick();
  };

  // Use collapsible behavior for mobile, tablet, and when forced
  const useCollapsibleBehavior = isMobile || isTablet || forceCollapsible;
  return <>
      {/* Mobile Overlay - Only show on mobile */}
      {isMobile && mobileOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => onMobileOpenChange?.(false)} />}
      
      {/* Sidebar Container */}
      <div className={cn("z-50 bg-background/80 dark:bg-card/80 backdrop-blur-sm border border-border/50 shadow-card", useCollapsibleBehavior ? mobileOpen ? "fixed left-0 top-0 h-full w-[280px]" : "fixed left-[-280px] top-0 h-full w-[280px]" : "fixed left-0 top-0 h-full w-[200px]")}>
        <div className="py-4 h-screen flex flex-col">
          {/* Mobile Close Button - Only show on mobile */}
          {isMobile && <div className="flex justify-end pb-0 px-[16px]">
              <Button variant="ghost" size="icon" onClick={() => onMobileOpenChange?.(false)} className="h-8 w-8 text-foreground hover:bg-accent">
                <X className="h-5 w-5" />
              </Button>
            </div>}
          
          {/* Logo */}
          <div className={cn("px-4 mb-4", isMobile ? "py-1" : "py-2")}>
            <a href="https://tradelens.app/" target="_self" className="flex items-center gap-3 font-bold text-foreground hover:text-primary">
              <img src="/tradelens_logo.webp" alt="TradeLens Logo" className="h-10 w-10" />
              <span className="text-2xl font-semibold mx-px">TradeLens</span>
            </a>
          </div>
          
          {/* Admin Menu - Only shown for admins or managers */}
          {(isAdmin || isManager) && <div className="mb-2 bg-[8b5cf6] bg-violet-500 rounded-2xl py-[4px] px-[15px]">
              <AdminNavDropdown />
            </div>}
          
          {/* Menu Items */}
          <div className="py-2 flex-1 overflow-y-auto">
            {filteredMenuItems.map((item, index) => {
            if (item.divider) {
              return <div key={`divider-${index}`} className="border-t border-border my-2" />;
            }
            if (item.special) {
              return <div key={`special-${index}`} className="px-3 mb-1">
                    <Button variant="secondary" className="justify-start font-normal bg-primary hover:bg-primary/90 text-primary-foreground w-full shadow-md rounded-lg min-h-[44px]" onClick={handleAddTrade}>
                      <div className="flex items-center gap-2 w-full">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                    </Button>
                  </div>;
            }
            return <div key={`link-${index}`} className="mb-1 px-3">
                  <button onClick={() => handleLinkClick(item.path || "", item.external)} className={cn("flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-foreground hover:bg-accent/60 min-h-[44px] w-full text-left transition-colors", !item.external && isActiveRoute(item.path || "") ? "bg-primary/20 text-primary font-medium border border-primary/30" : "")}>
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                </div>;
          })}
          </div>
          
          {/* Logout Button */}
          <div className="px-3 py-4 mt-auto">
            <Button variant="outline" onClick={handleSignOut} className="border-border w-full text-foreground bg-background hover:bg-accent hover:text-foreground rounded-lg min-h-[44px]">
              <LogOut className="h-4 w-4" />
              <span className="ml-2">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </>;
};
