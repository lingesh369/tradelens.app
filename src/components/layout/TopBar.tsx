
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Menu, Settings } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { DateRangeSelector } from "@/components/filters/DateRangeSelector";
import { AccountSelector } from "@/components/filters/AccountSelector";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useGlobalFilters } from "@/context/FilterContext";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface TopBarProps {
  title: string;
  showAccountSelector?: boolean;
  onMobileMenuClick?: () => void;
  showMobileMenu?: boolean;
}

export default function TopBar({
  title,
  showAccountSelector = false,
  onMobileMenuClick,
  showMobileMenu = false
}: TopBarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { filters, updateDateRange, updateSelectedAccounts } = useGlobalFilters();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully"
      });
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error signing out",
        variant: "destructive"
      });
    }
  };

  const getInitials = () => {
    const firstName = user?.user_metadata?.first_name;
    const lastName = user?.user_metadata?.last_name;
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <div className="h-16 border-b flex items-center justify-between px-4">
      {/* Left side - Mobile menu + Title */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button - Show when showMobileMenu is true */}
        {showMobileMenu && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9"
            onClick={onMobileMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        {/* Page Title */}
        <h1 className="text-lg md:text-xl font-semibold truncate">{title}</h1>
      </div>
      
      {/* Right side - Filters & Actions */}
      <div className="flex items-center gap-1 md:gap-4">
        {/* Mobile Filters Drawer */}
        {isMobile && showAccountSelector && (
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                Filters
              </Button>
            </DrawerTrigger>
            <DrawerContent className="px-4 pb-4">
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Accounts</label>
                  <AccountSelector 
                    onChange={updateSelectedAccounts} 
                    selectedAccounts={filters.selectedAccounts} 
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Date Range</label>
                  <DateRangeSelector 
                    onChange={updateDateRange}
                    value={filters.dateRange}
                  />
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        )}
        
        {/* Desktop Filters */}
        {!isMobile && (
          <>
            {/* Account Selector */}
            {showAccountSelector && (
              <div className="hidden sm:block">
                <AccountSelector 
                  onChange={updateSelectedAccounts} 
                  selectedAccounts={filters.selectedAccounts} 
                />
              </div>
            )}
            
            {/* Date Range Selector */}
            <div className="hidden sm:block">
              <DateRangeSelector 
                onChange={updateDateRange}
                value={filters.dateRange}
              />
            </div>
          </>
        )}
        
        {/* Notification Bell */}
        <NotificationBell />
        
        <ThemeToggle />
        
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="rounded-full" size="icon">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
