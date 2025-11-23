
import React from 'react';
import { Calendar, Clock, Globe, Tag, TriangleAlert, BookOpen, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface AnalyticsSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  canAccessAllTabs?: boolean;
}

export const AnalyticsSidebar: React.FC<AnalyticsSidebarProps> = ({
  activeSection,
  setActiveSection,
  canAccessAllTabs = false
}) => {
  const isMobile = useMediaQuery("(max-width: 768px)");

  const menuItems = [{
    name: "overview",
    label: "Overview",
    icon: <LayoutDashboard className="h-4 w-4" />,
    children: [],
    restricted: false
  }, {
    name: "datetime",
    label: "Date & Time",
    icon: <Clock className="h-4 w-4" />,
    hasDropdown: true,
    children: [{
      name: "days",
      label: "Days"
    }, {
      name: "weeks",
      label: "Weeks"
    }, {
      name: "months",
      label: "Months"
    }, {
      name: "tradetime",
      label: "Trade Time"
    }, {
      name: "duration",
      label: "Trade Duration"
    }],
    restricted: !canAccessAllTabs
  }, {
    name: "markets",
    label: "Markets & Instruments",
    icon: <Globe className="h-4 w-4" />,
    hasDropdown: true,
    children: [{
      name: "markets",
      label: "Markets"
    }, {
      name: "instruments",
      label: "Instruments"
    }],
    restricted: !canAccessAllTabs
  }, {
    name: "strategies",
    label: "Strategies",
    icon: <BookOpen className="h-4 w-4" />,
    children: [],
    restricted: !canAccessAllTabs
  }, {
    name: "risk",
    label: "Risk",
    icon: <TriangleAlert className="h-4 w-4" />,
    hasDropdown: true,
    children: [{
      name: "rmultiple",
      label: "R2R"
    }, {
      name: "positionsize",
      label: "Position Size"
    }],
    restricted: !canAccessAllTabs
  }, {
    name: "tags",
    label: "Tags",
    icon: <Tag className="h-4 w-4" />,
    hasDropdown: true,
    children: [{
      name: "mistaketags",
      label: "Mistake Tags"
    }, {
      name: "othertags",
      label: "Other Tags"
    }],
    restricted: !canAccessAllTabs
  }, {
    name: "calendar",
    label: "Calendar",
    icon: <Calendar className="h-4 w-4" />,
    children: [],
    restricted: !canAccessAllTabs
  }];

  const handleSectionClick = (name: string, restricted: boolean) => {
    if (!restricted) {
      setActiveSection(name);
    }
  };

  const handleChildClick = (name: string, parentRestricted: boolean) => {
    if (!parentRestricted) {
      setActiveSection(name);
    }
  };

  if (isMobile) {
    const activeItem = menuItems.find(item => item.name === activeSection || item.children?.some(child => child.name === activeSection));
    const activeChildItem = activeItem?.children?.find(child => child.name === activeSection);
    const displayLabel = activeChildItem?.label || activeItem?.label || "Select View";
    const displayIcon = activeItem?.icon;

    return <div className="bg-background border-b w-full py-2 px-4 sticky top-0 z-30">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                {displayIcon}
                {displayLabel}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 z-50">
            {menuItems.map(item => {
            if (item.children.length === 0) {
              return <DropdownMenuItem 
                        key={item.name} 
                        className={cn(
                          activeSection === item.name && "bg-accent font-medium",
                          item.restricted && "opacity-60 cursor-not-allowed"
                        )} 
                        onClick={() => handleSectionClick(item.name, item.restricted)}
                        disabled={item.restricted}
                      >
                    <span className="flex items-center gap-2">
                      {item.icon}
                      {item.label}
                      {item.restricted && <span className="text-xs ml-auto opacity-70">Pro</span>}
                    </span>
                  </DropdownMenuItem>;
            }
            return <React.Fragment key={item.name}>
                  <DropdownMenuItem className={cn("font-medium", item.restricted && "opacity-60")} disabled>
                    <span className="flex items-center gap-2">
                      {item.icon}
                      {item.label}
                      {item.restricted && <span className="text-xs ml-auto opacity-70">Pro</span>}
                    </span>
                  </DropdownMenuItem>
                  {item.children.map(child => <DropdownMenuItem 
                                                key={child.name} 
                                                className={cn(
                                                  "pl-8", 
                                                  activeSection === child.name && "bg-accent font-medium",
                                                  item.restricted && "opacity-60 cursor-not-allowed"
                                                )} 
                                                onClick={() => handleChildClick(child.name, item.restricted)}
                                                disabled={item.restricted}
                                              >
                      {child.label}
                    </DropdownMenuItem>)}
                </React.Fragment>;
          })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>;
  }

  return <div className="bg-background border-b w-full py-2 px-2 sticky top-0 z-30 overflow-x-auto">
      <div className="flex items-center space-x-1 px-[180px]">
        {menuItems.map(item => {
        if (item.children.length === 0) {
          return <Button 
                  key={item.name} 
                  variant={activeSection === item.name ? "secondary" : "ghost"} 
                  size="sm" 
                  className={cn(
                    "flex items-center gap-1.5", 
                    activeSection === item.name && "bg-primary/10 text-primary font-medium",
                    item.restricted && "opacity-60"
                  )} 
                  onClick={() => handleSectionClick(item.name, item.restricted)}
                  disabled={item.restricted}
                >
                {item.icon}
                <span>{item.label}</span>
                {item.restricted && <span className="text-[10px] font-medium opacity-70">PRO</span>}
              </Button>;
        }

        return <DropdownMenu key={item.name}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "flex items-center gap-1.5", 
                    (activeSection === item.name || item.children.some(child => child.name === activeSection)) && "bg-primary/10 text-primary font-medium",
                    item.restricted && "opacity-60"
                  )}
                  disabled={item.restricted}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.restricted && <span className="text-[10px] font-medium opacity-70">PRO</span>}
                </Button>
              </DropdownMenuTrigger>
              {!item.restricted && (
                <DropdownMenuContent align="start" className="z-50">
                  {item.children.map(child => <DropdownMenuItem 
                                                key={child.name} 
                                                className={cn(activeSection === child.name && "bg-accent font-medium")} 
                                                onClick={() => handleChildClick(child.name, false)}
                                              >
                      {child.label}
                    </DropdownMenuItem>)}
                </DropdownMenuContent>
              )}
            </DropdownMenu>;
      })}
      </div>
    </div>;
};
