
import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { SecurityDashboard } from '@/components/admin/security/SecurityDashboard';

const SecurityPage = () => {
  return (
    <AdminLayout>
      <SecurityDashboard />
    </AdminLayout>
  );
};

export default SecurityPage;
