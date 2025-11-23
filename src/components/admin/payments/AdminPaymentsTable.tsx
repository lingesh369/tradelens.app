
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, ArrowUpDown, Download, Edit2, Filter, X, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAdminPayments } from '@/hooks/admin/useAdminPayments';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { PaymentEditModal } from './PaymentEditModal';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { MultiSelect } from '@/components/ui/multi-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type AdminPaymentsTableProps = ReturnType<typeof useAdminPayments>;

export const AdminPaymentsTable: React.FC<AdminPaymentsTableProps> = ({
  payments: allPayments,
  paginatedPayments,
  isLoading,
  searchTerm,
  setSearchTerm,
  planFilter,
  setPlanFilter,
  statusFilter,
  setStatusFilter,
  methodFilter,
  setMethodFilter,
  dateRange,
  setDateRange,
  sortBy,
  setSortBy,
  page,
  setPage,
  totalPages,
  handleExportCSV,
  totalPayments,
  selectedPayments,
  setSelectedPayments,
  handleBulkStatusUpdate,
  handleBulkDelete,
  clearFilters,
  planOptions,
  statusOptions,
  methodOptions,
  refetch,
  error,
}) => {
  const [editingPayment, setEditingPayment] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Ensure we have valid arrays for the MultiSelect components
  const safePlanOptions = Array.isArray(planOptions) ? planOptions : [];
  const safeStatusOptions = Array.isArray(statusOptions) ? statusOptions : [];
  const safeMethodOptions = Array.isArray(methodOptions) ? methodOptions : [];
  const safePlanFilter = Array.isArray(planFilter) ? planFilter : [];
  const safeStatusFilter = Array.isArray(statusFilter) ? statusFilter : [];
  const safeMethodFilter = Array.isArray(methodFilter) ? methodFilter : [];

  const handleSort = (key: string) => {
    if (sortBy.key === key) {
      setSortBy({ key, direction: sortBy.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      setSortBy({ key, direction: 'desc' });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'succeeded':
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const toggleSelectAll = () => {
    if (selectedPayments.length === paginatedPayments.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(paginatedPayments.map(p => p.payment_id));
    }
  };

  const toggleSelectPayment = (paymentId: string) => {
    setSelectedPayments(prev => 
      prev.includes(paymentId) 
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  const hasActiveFilters = safePlanFilter.length > 0 || safeStatusFilter.length > 0 || safeMethodFilter.length > 0 || dateRange?.from || searchTerm;

  return (
    <div className="w-full max-w-full space-y-4 sm:space-y-6">
      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading payments: {error.message}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters Section */}
      <div className="glass-card rounded-xl p-3 sm:p-5 card-shine">
        <div className="space-y-4">
          {/* Search and Main Actions */}
          <div className="flex flex-col gap-4">
            <Input
              placeholder="Search by email, username, Order ID, Invoice ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            
            {/* Mobile Filter Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="sm:hidden">
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filters
                    </div>
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-2">
                        Active
                      </Badge>
                    )}
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button onClick={handleExportCSV} variant="outline" disabled={totalPayments === 0} className="text-xs sm:text-sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                {hasActiveFilters && (
                  <Button onClick={clearFilters} variant="outline" size="sm" className="text-xs sm:text-sm">
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Filters Content */}
          <div className="space-y-4">
            {/* Mobile Collapsible Wrapper */}
            <div className="sm:hidden">
              <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
                <CollapsibleContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Plan</label>
                      <MultiSelect
                        options={safePlanOptions}
                        selected={safePlanFilter}
                        onChange={setPlanFilter}
                        placeholder="Select plans..."
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Payment Status</label>
                      <MultiSelect
                        options={safeStatusOptions}
                        selected={safeStatusFilter}
                        onChange={setStatusFilter}
                        placeholder="Select statuses..."
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Payment Method</label>
                      <MultiSelect
                        options={safeMethodOptions}
                        selected={safeMethodFilter}
                        onChange={setMethodFilter}
                        placeholder="Select methods..."
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date Range</label>
                      <DatePickerWithRange
                        date={dateRange}
                        onDateChange={setDateRange}
                        className="w-full"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Desktop Always Visible */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Plan</label>
                <MultiSelect
                  options={safePlanOptions}
                  selected={safePlanFilter}
                  onChange={setPlanFilter}
                  placeholder="Select plans..."
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Status</label>
                <MultiSelect
                  options={safeStatusOptions}
                  selected={safeStatusFilter}
                  onChange={setStatusFilter}
                  placeholder="Select statuses..."
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method</label>
                <MultiSelect
                  options={safeMethodOptions}
                  selected={safeMethodFilter}
                  onChange={setMethodFilter}
                  placeholder="Select methods..."
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <DatePickerWithRange
                  date={dateRange}
                  onDateChange={setDateRange}
                  className="w-full"
                />
              </div>
            </div>
          </div>


        </div>

        {/* Bulk Actions */}
        {selectedPayments.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center gap-2 mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <span className="text-sm font-medium">{selectedPayments.length} payment(s) selected</span>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate('succeeded')} className="text-xs">
                Mark as Succeeded
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate('failed')} className="text-xs">
                Mark as Failed
              </Button>
              <Button size="sm" variant="destructive" onClick={handleBulkDelete} className="text-xs">
                Delete Selected
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="glass-card rounded-xl p-3 sm:p-5 card-shine">
        {/* Debug info */}
        {!isLoading && !error && (
          <div className="mb-4 text-xs sm:text-sm text-muted-foreground">
            Total payments in database: {allPayments.length} | Filtered: {totalPayments}
          </div>
        )}

        <div className="w-full">
          <ScrollArea className="w-full">
            <div className="min-w-[1000px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedPayments.length === paginatedPayments.length && paginatedPayments.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort('username')}>
                      <div className="flex items-center">
                        User <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort('payment_date')}>
                      <div className="flex items-center">
                        Date <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Plan</TableHead>
                    <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort('amount')}>
                      <div className="flex items-center">
                        Amount <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Method</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Order/Invoice ID</TableHead>
                    <TableHead className="whitespace-nowrap">Admin Notes</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={10}><Skeleton className="h-6 sm:h-8 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-24 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <AlertCircle className="h-8 w-8 text-destructive" />
                          <p className="text-xs sm:text-sm">Failed to load payments data</p>
                          <Button variant="outline" onClick={() => refetch()} className="text-xs">
                            Try Again
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedPayments.length > 0 ? (
                    paginatedPayments.map((payment) => (
                      <TableRow key={payment.payment_id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedPayments.includes(payment.payment_id)}
                            onCheckedChange={() => toggleSelectPayment(payment.payment_id)}
                          />
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex flex-col max-w-[150px]">
                            <Link 
                              to={`/admin/users/${payment.username}`} 
                              className="font-medium hover:underline text-blue-600 dark:text-blue-400 truncate"
                              title={payment.username || 'N/A'}
                            >
                              {payment.username || 'N/A'}
                            </Link>
                            <span className="text-xs text-muted-foreground truncate" title={payment.email}>
                              {payment.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className="text-xs sm:text-sm">
                            {format(new Date(payment.payment_date), 'MMM d, yyyy, p')}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="outline" className="text-xs">{payment.subscription_plan || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className="text-xs sm:text-sm font-medium">
                            {formatCurrency(payment.amount, payment.currency)}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="secondary" className="text-xs">{payment.payment_method || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant={getStatusBadgeVariant(payment.payment_status)} className="text-xs">
                            {payment.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="text-xs space-y-1 max-w-[120px]">
                            {payment.order_number && (
                              <div className="truncate" title={`Order: ${payment.order_number}`}>
                                Order: {payment.order_number}
                              </div>
                            )}
                            {payment.invoice_id && (
                              <div className="truncate" title={`Invoice: ${payment.invoice_id}`}>
                                Invoice: {payment.invoice_id}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="max-w-[140px] truncate text-xs" title={payment.admin_notes}>
                            {payment.admin_notes || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-6 w-6 sm:h-8 sm:w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingPayment(payment)}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="h-24 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <p className="text-xs sm:text-sm">No payments found.</p>
                          {hasActiveFilters && (
                            <Button variant="outline" onClick={clearFilters} className="text-xs">
                              Clear Filters
                            </Button>
                          )}
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
        
        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 sm:space-x-2 py-4 border-t mt-4">
          <div className="text-xs sm:text-sm text-muted-foreground">
            {totalPayments} payment(s) found.
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs sm:text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="text-xs sm:text-sm"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="text-xs sm:text-sm"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {editingPayment && (
        <PaymentEditModal
          payment={editingPayment}
          isOpen={!!editingPayment}
          onClose={() => setEditingPayment(null)}
        />
      )}
    </div>
  );
};
