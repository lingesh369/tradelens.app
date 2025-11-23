
import React, { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { CouponsTable } from '@/components/admin/coupons/CouponsTable';
import { useCoupons } from '@/hooks/admin/useCoupons';
import { Button } from '@/components/ui/button';
import { PlusCircle, Download } from 'lucide-react';
import { CouponsMetrics } from '@/components/admin/coupons/CouponsMetrics';
import { CouponDialog } from '@/components/admin/coupons/CouponDialog';
import { CouponsFilters, CouponFilters } from '@/components/admin/coupons/CouponsFilters';
import { Coupon } from '@/types/coupon';
import { useToast } from '@/components/ui/use-toast';
import { exportCouponsToCSV } from '@/lib/admin-utils';

const CouponsPage = () => {
  const { coupons, isLoading } = useCoupons();
  const { toast } = useToast();
  const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [filters, setFilters] = useState<CouponFilters>({
    search: '',
    status: 'all',
    createdBy: 'all',
  });

  // Filter coupons based on current filters
  const filteredCoupons = useMemo(() => {
    if (!coupons) return [];

    return coupons.filter((coupon) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!coupon.name.toLowerCase().includes(searchLower) && 
            !coupon.code.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (filters.status !== 'all') {
        const isExpired = coupon.validity_end_date && new Date(coupon.validity_end_date) < new Date();
        const currentStatus = isExpired ? 'expired' : coupon.status;
        if (currentStatus !== filters.status) {
          return false;
        }
      }

      // Created by filter (would need to be added to coupon data structure)
      // For now, we'll assume all are created by admin
      if (filters.createdBy !== 'all' && filters.createdBy !== 'admin') {
        return false;
      }

      // Validity date filters
      if (filters.validityStart && coupon.validity_start_date) {
        if (new Date(coupon.validity_start_date) < filters.validityStart) {
          return false;
        }
      }

      if (filters.validityEnd && coupon.validity_end_date) {
        if (new Date(coupon.validity_end_date) > filters.validityEnd) {
          return false;
        }
      }

      return true;
    });
  }, [coupons, filters]);

  const handleEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsCouponDialogOpen(true);
  };

  const handleDelete = (coupon: Coupon) => {
    // Delete is handled directly in the table component
  };

  const handleCreateNew = () => {
    setSelectedCoupon(null);
    setIsCouponDialogOpen(true);
  };

  const handleExportCSV = async () => {
    try {
      await exportCouponsToCSV(filteredCoupons);
      toast({
        title: 'Success',
        description: 'Coupons exported to CSV successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export coupons',
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminLayout>
      <div className="w-full max-w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Coupons</h1>
            <p className="text-muted-foreground">Create and manage discount coupons.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleExportCSV} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={handleCreateNew} className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Create New Coupon
            </Button>
          </div>
        </div>

        {/* Metrics Overview */}
        <CouponsMetrics coupons={coupons || []} />

        {/* Filters */}
        <CouponsFilters onFiltersChange={setFilters} />

        {/* Coupons Table */}
        <CouponsTable
          coupons={filteredCoupons}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Create/Edit Dialog */}
        <CouponDialog
          open={isCouponDialogOpen}
          onOpenChange={setIsCouponDialogOpen}
          coupon={selectedCoupon}
        />
      </div>
    </AdminLayout>
  );
};

export default CouponsPage;
