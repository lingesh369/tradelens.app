
import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { AdminProfileDropdown } from './AdminProfileDropdown';

interface AdminTopBarProps {
  onMobileMenuClick: () => void;
  showMobileMenu: boolean;
  sidebarCollapsed: boolean;
  onSidebarToggle: () => void;
}

export const AdminTopBar: React.FC<AdminTopBarProps> = ({
  onMobileMenuClick,
  showMobileMenu,
  sidebarCollapsed,
  onSidebarToggle
}) => {
  const { user } = useAuth();

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        {showMobileMenu && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileMenuClick}
            className="h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        {/* Desktop sidebar toggle - only show on desktop */}
        {!showMobileMenu && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSidebarToggle}
            className="h-9 w-9"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
        
        <h1 className="text-xl font-semibold text-foreground">Admin Panel</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <ThemeToggle />
        {user && <AdminProfileDropdown />}
      </div>
    </header>
  );
};
