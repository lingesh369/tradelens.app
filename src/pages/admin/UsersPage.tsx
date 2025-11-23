
import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminUsersMetrics } from '@/components/admin/users/AdminUsersMetrics';
import { AdminUsersTable } from '@/components/admin/users/AdminUsersTable';
import { useAdminUsers } from '@/hooks/admin/useAdminUsers';

const UsersPage = () => {
  const adminUsersHook = useAdminUsers();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage your users and their details.</p>
        </div>
        <AdminUsersMetrics 
          metrics={adminUsersHook.metrics} 
          isLoading={adminUsersHook.isLoading} 
        />
        <AdminUsersTable {...adminUsersHook} />
      </div>
    </AdminLayout>
  );
};

export default UsersPage;
