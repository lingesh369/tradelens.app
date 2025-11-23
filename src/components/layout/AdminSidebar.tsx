
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAdminMediaQuery } from '@/hooks/use-admin-media-query';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard,
  Shield,
  Tag,
  Settings,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  DollarSign,
  Bell,
  ArrowLeft,
  LogOut
} from 'lucide-react';

interface AdminSidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { name: 'Payments', href: '/admin/payments', icon: CreditCard },
  { name: 'Coupons', href: '/admin/coupons', icon: Tag },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Sales', href: '/admin/sales', icon: DollarSign },
  { name: 'Notifications', href: '/admin/notifications', icon: Bell },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Security', href: '/admin/security', icon: Shield },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  collapsed,
  onCollapsedChange,
  mobileOpen,
  onMobileOpenChange
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { useCollapsibleBehavior } = useAdminMediaQuery();

  const SidebarContent = ({ isMobile = false }) => (
    <div className={cn(
      "flex h-full flex-col",
      !isMobile && "border-r bg-muted/10"
    )}>
      {/* Logo/Header */}
      <div className={cn(
        "flex items-center border-b px-6 py-4",
        collapsed && !isMobile && "px-4 justify-center"
      )}>
        <Link to="/admin" className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          {(isMobile || !collapsed) && (
            <span className="text-lg font-semibold">Admin Panel</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
                isActive 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                  : "text-muted-foreground",
                collapsed && !isMobile && "justify-center px-2"
              )}
              onClick={() => isMobile && onMobileOpenChange(false)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {(isMobile || !collapsed) && item.name}
            </Link>
          );
        })}
      </nav>

      {/* Special Navigation Items */}
      <div className="border-t px-3 py-4 space-y-1">
        {/* Back to App */}
        <Button
          variant="ghost"
          onClick={() => {
            navigate('/');
            isMobile && onMobileOpenChange(false);
          }}
          className={cn(
            "w-full justify-start gap-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
            collapsed && !isMobile && "justify-center px-2"
          )}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          {(isMobile || !collapsed) && "Back to App"}
        </Button>

        {/* Logout */}
        <Button
          variant="ghost"
          onClick={() => {
            logout();
            isMobile && onMobileOpenChange(false);
          }}
          className={cn(
            "w-full justify-start gap-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
            collapsed && !isMobile && "justify-center px-2"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {(isMobile || !collapsed) && "Logout"}
        </Button>
      </div>

      {/* Collapse button for desktop */}
      {!isMobile && !useCollapsibleBehavior && (
        <div className="border-t p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCollapsedChange(!collapsed)}
            className={cn(
              "w-full justify-center",
              collapsed && "px-2"
            )}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span className="ml-2">Collapse</span>}
          </Button>
        </div>
      )}
    </div>
  );

  if (useCollapsibleBehavior) {
    return (
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent isMobile />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-all duration-300",
        collapsed ? "w-[60px]" : "w-[240px]"
      )}
    >
      <SidebarContent />
    </div>
  );
};
