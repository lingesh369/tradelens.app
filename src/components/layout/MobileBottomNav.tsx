
import { useLocation, useNavigate } from "react-router-dom";
import { Home, ListOrdered, Plus, BookOpen, BarChart4 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Don't render on non-mobile devices
  if (!isMobile) {
    return null;
  }

  const navItems = [
    {
      path: "/",
      label: "Dashboard",
      icon: Home,
      isSpecial: false
    },
    {
      path: "/trades",
      label: "Trades", 
      icon: ListOrdered,
      isSpecial: false
    },
    {
      path: "/add-trade",
      label: "Add",
      icon: Plus,
      isSpecial: true
    },
    {
      path: "/journal",
      label: "Journal",
      icon: BookOpen,
      isSpecial: false
    },
    {
      path: "/strategies",
      label: "Strategies",
      icon: BarChart4,
      isSpecial: false
    }
  ];

  const isActiveRoute = (path: string) => {
    if (path === "/" && (location.pathname === "/" || location.pathname === "/dashboard")) {
      return true;
    }
    return location.pathname.startsWith(path) && path !== "/";
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item.path);
          
          if (item.isSpecial) {
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className="flex flex-col items-center justify-center min-w-[60px] py-1"
              >
                <div className="bg-purple-500 hover:bg-purple-600 rounded-full p-3 shadow-lg transition-colors">
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center min-w-[60px] py-2 transition-colors rounded-lg",
                isActive 
                  ? "text-purple-500" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 mb-1",
                isActive ? "text-purple-500" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-xs font-medium",
                isActive ? "text-purple-500" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
