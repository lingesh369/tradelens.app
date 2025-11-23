
import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPaymentsMetrics } from '@/components/admin/payments/AdminPaymentsMetrics';
import { AdminPaymentsTable } from '@/components/admin/payments/AdminPaymentsTable';
import { useAdminPayments } from '@/hooks/admin/useAdminPayments';

const PaymentsPage = () => {
  const adminPaymentsHook = useAdminPayments();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">Manage payments and transaction details.</p>
        </div>
        <AdminPaymentsMetrics />
        <AdminPaymentsTable {...adminPaymentsHook} />
      </div>
    </AdminLayout>
  );
};

export default PaymentsPage;
