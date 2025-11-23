
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  Settings, 
  ChevronDown,
  Shield,
  Ticket,
} from 'lucide-react';

export const AdminNavDropdown = () => {
  const navigate = useNavigate();
  const { userRole, isRoleLoading } = useAuth();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 h-9 px-3 w-full justify-start text-white hover:bg-purple-500/30 hover:text-white transition-all duration-200 rounded-lg"
        >
          <Shield className="h-4 w-4" />
          Admin
          <ChevronDown className="h-4 w-4 ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel>
          Admin Panel {!isRoleLoading && userRole ? `(${userRole})` : ''}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/admin')}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          <span>Dashboard</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/admin/users')}>
          <Users className="mr-2 h-4 w-4" />
          <span>Manage Users</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/admin/payments')}>
          <DollarSign className="mr-2 h-4 w-4" />
          <span>Payments</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/admin/coupons')}>
          <Ticket className="mr-2 h-4 w-4" />
          <span>Coupons</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/admin/sales')}>
          <DollarSign className="mr-2 h-4 w-4" />
          <span>Sales Analytics</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
