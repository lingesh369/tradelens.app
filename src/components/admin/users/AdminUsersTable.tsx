
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { RoleManagement } from '@/components/admin/security/RoleManagement';
import { AdminUserColumnSelector } from './AdminUserColumnSelector';
import { adminUserColumns, getColumnValue } from './AdminUserTableColumns';
import { User } from '@/hooks/admin/useAdminUsers';
import { Search, Download, MoreHorizontal, Ban, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

interface AdminUsersTableProps {
  users: User[];
  paginatedUsers: User[];
  isLoading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  planFilter: string;
  setPlanFilter: (plan: string) => void;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  totalUsers: number;
  handleExportCSV: () => void;
  openDeleteModal: (user: User) => void;
  openSuspendModal: (user: User) => void;
}

export const AdminUsersTable: React.FC<AdminUsersTableProps> = ({
  users,
  paginatedUsers,
  isLoading,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  planFilter,
  setPlanFilter,
  page,
  setPage,
  totalPages,
  totalUsers,
  handleExportCSV,
  openDeleteModal,
  openSuspendModal,
}) => {
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Initialize selected columns with default columns
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    adminUserColumns.filter(col => col.default).map(col => col.id)
  );

  const handleRowClick = (user: User, event: React.MouseEvent) => {
    // Don't navigate if clicking on action buttons or dropdowns
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="menuitem"]')) {
      return;
    }
    
    const username = user.username || user.email;
    navigate(`/admin/users/${username}`);
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'Active' ? 'default' : status === 'Suspended' ? 'destructive' : 'secondary';
    return <Badge variant={variant}>{status}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const variant = role === 'Admin' ? 'destructive' : role === 'Manager' ? 'default' : 'secondary';
    return <Badge variant={variant}>{role}</Badge>;
  };

  const getPlanBadge = (plan: string) => {
    const variant = plan.includes('Pro') ? 'default' : plan.includes('Starter') ? 'secondary' : 'outline';
    return <Badge variant={variant}>{plan}</Badge>;
  };

  const uniquePlans = Array.from(new Set(users.map(user => user.subscription_plan))).filter(Boolean);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users Management</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Plans</SelectItem>
                {uniquePlans.map((plan) => (
                  <SelectItem key={plan} value={plan}>{plan}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <AdminUserColumnSelector
              selectedColumns={selectedColumns}
              onColumnChange={setSelectedColumns}
            />

            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {adminUserColumns
                      .filter(col => selectedColumns.includes(col.id))
                      .map(col => (
                        <TableHead key={col.id}>{col.label}</TableHead>
                      ))
                    }
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user) => (
                    <TableRow 
                      key={user.user_id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={(e) => handleRowClick(user, e)}
                    >
                      {adminUserColumns
                        .filter(col => selectedColumns.includes(col.id))
                        .map(col => (
                          <TableCell key={col.id}>
                            {col.id === 'username' ? (
                              <div>
                                <div className="font-medium">
                                  {user.username || `${user.first_name} ${user.last_name}`.trim() || 'No name'}
                                </div>
                                <div className="text-sm text-muted-foreground font-mono">
                                  {user.user_id.slice(0, 8)}...
                                </div>
                              </div>
                            ) : col.id === 'user_role' ? (
                              getRoleBadge(user.user_role)
                            ) : col.id === 'user_status' ? (
                              getStatusBadge(user.user_status)
                            ) : col.id === 'subscription_plan' ? (
                              getPlanBadge(user.subscription_plan)
                            ) : col.id === 'signup_date' ? (
                              format(new Date(user.signup_date), 'MMM dd, yyyy')
                            ) : col.id === 'last_login' ? (
                              user.last_login 
                                ? format(new Date(user.last_login), 'MMM dd, yyyy')
                                : 'Never'
                            ) : (
                              getColumnValue(user, col.id)
                            )}
                          </TableCell>
                        ))
                      }
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <RoleManagement
                            userId={user.user_id}
                            currentRole={user.user_role}
                            username={user.username || user.email}
                          />
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openSuspendModal(user)}
                                className="text-orange-600"
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                {user.user_status === 'Active' ? 'Suspend' : 'Activate'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => openDeleteModal(user)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, totalUsers)} of {totalUsers} users
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
