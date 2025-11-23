
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Copy, Trash2, Power, PowerOff } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Coupon } from '@/types/coupon';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCoupon, updateCoupon, duplicateCoupon } from '@/lib/admin-utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const StatusBadge = ({ status, endDate }: { status: string; endDate?: string }) => {
  // Check if coupon is expired
  const isExpired = endDate && new Date(endDate) < new Date();
  const displayStatus = isExpired ? 'expired' : status;

  switch (displayStatus) {
    case 'active':
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Active</Badge>;
    case 'expired':
      return <Badge variant="destructive">Expired</Badge>;
    case 'disabled':
      return <Badge variant="secondary">Disabled</Badge>;
    default:
      return <Badge variant="outline">{displayStatus}</Badge>;
  }
};

interface CouponsTableProps {
  coupons: Coupon[];
  isLoading: boolean;
  onEdit: (coupon: Coupon) => void;
  onDelete: (coupon: Coupon) => void;
}

export const CouponsTable = ({ coupons, isLoading, onEdit, onDelete }: CouponsTableProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      updateCoupon(id, { status: status === 'active' ? 'disabled' : 'active' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast({
        title: 'Success',
        description: 'Coupon status updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update coupon status',
        variant: 'destructive',
      });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast({
        title: 'Success',
        description: 'Coupon duplicated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to duplicate coupon',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast({
        title: 'Success',
        description: 'Coupon deleted successfully',
      });
      setDeleteDialogOpen(false);
      setSelectedCoupon(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete coupon',
        variant: 'destructive',
      });
    },
  });

  const handleToggleStatus = (coupon: Coupon) => {
    toggleStatusMutation.mutate({ id: coupon.id, status: coupon.status });
  };

  const handleDuplicate = (coupon: Coupon) => {
    duplicateMutation.mutate(coupon.id);
  };

  const handleDeleteClick = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedCoupon) {
      deleteMutation.mutate(selectedCoupon.id);
    }
  };

  return (
    <div className="w-full max-w-full">
      <Card>
        <CardHeader>
          <CardTitle>All Coupons</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-hidden">
            <ScrollArea className="w-full">
              <div className="min-w-[800px] p-3 sm:p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px] whitespace-nowrap">Coupon Name</TableHead>
                      <TableHead className="min-w-[100px] whitespace-nowrap">Code</TableHead>
                      <TableHead className="min-w-[80px] whitespace-nowrap">Discount</TableHead>
                      <TableHead className="min-w-[100px] whitespace-nowrap">Type</TableHead>
                      <TableHead className="min-w-[80px] whitespace-nowrap">Usage Limit</TableHead>
                      <TableHead className="min-w-[60px] whitespace-nowrap">Used</TableHead>
                      <TableHead className="min-w-[80px] whitespace-nowrap">Status</TableHead>
                      <TableHead className="min-w-[140px] whitespace-nowrap">Validity</TableHead>
                      <TableHead className="min-w-[80px] text-right whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">Loading...</TableCell>
                      </TableRow>
                    ) : coupons.length > 0 ? (
                      coupons.map((coupon) => (
                        <TableRow key={coupon.id}>
                          <TableCell className="font-medium">
                            <div className="max-w-[120px] truncate" title={coupon.name}>
                              {coupon.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="px-2 py-1 bg-muted rounded text-xs sm:text-sm font-mono">
                              {coupon.code}
                            </code>
                          </TableCell>
                          <TableCell className="text-sm">
                            {coupon.discount_type === 'percentage'
                              ? `${coupon.discount_value}%`
                              : `$${coupon.discount_value}`}
                          </TableCell>
                          <TableCell className="capitalize text-sm">
                            {coupon.discount_type === 'percentage' ? 'Percentage' : 'Flat Amount'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {coupon.usage_limit_total || '∞'}
                          </TableCell>
                          <TableCell className="text-sm">
                            <span className={coupon.used_count > 0 ? 'font-medium' : 'text-muted-foreground'}>
                              {coupon.used_count}
                            </span>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={coupon.status} endDate={coupon.validity_end_date} />
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[140px] text-xs sm:text-sm">
                              {coupon.validity_start_date && coupon.validity_end_date ? (
                                <span>
                                  {format(new Date(coupon.validity_start_date), 'MMM d')} - {format(new Date(coupon.validity_end_date), 'MMM d, yyyy')}
                                </span>
                              ) : coupon.validity_end_date ? (
                                <span>
                                  Until {format(new Date(coupon.validity_end_date), 'MMM d, yyyy')}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">No expiry</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-6 w-6 sm:h-8 sm:w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit(coupon)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleStatus(coupon)}>
                                  {coupon.status === 'active' ? (
                                    <>
                                      <PowerOff className="mr-2 h-4 w-4" />
                                      Disable
                                    </>
                                  ) : (
                                    <>
                                      <Power className="mr-2 h-4 w-4" />
                                      Enable
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicate(coupon)}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive" 
                                  onClick={() => handleDeleteClick(coupon)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <p className="text-muted-foreground">No coupons found.</p>
                            <p className="text-sm text-muted-foreground">Create your first coupon to get started.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the coupon "{selectedCoupon?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
