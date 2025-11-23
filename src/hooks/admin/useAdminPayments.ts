
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';

interface PaymentRecord {
  payment_id: string;
  user_id: string;
  username: string;
  email: string;
  amount: number;
  currency: string;
  payment_status: string;
  payment_method: string;
  subscription_plan: string;
  billing_cycle: string;
  payment_date: string;
  order_number: string;
  invoice_id: string;
  transaction_id: string;
  admin_notes: string;
  created_at: string;
}

export const useAdminPayments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [methodFilter, setMethodFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortBy, setSortBy] = useState({ key: 'payment_date', direction: 'desc' as 'asc' | 'desc' });
  const [page, setPage] = useState(1);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  
  const { toast } = useToast();
  const itemsPerPage = 20;

  // Enhanced query with better error handling
  const { data: payments = [], isLoading, refetch, error } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      console.log('Fetching payments data...');
      
      try {
        // Try the RPC function first
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_admin_payments');
        
        if (rpcError) {
          console.error('RPC error:', rpcError);
          // Log more details about the RPC error
          console.error('RPC error details:', {
            code: rpcError.code,
            message: rpcError.message,
            details: rpcError.details,
            hint: rpcError.hint
          });
          throw rpcError;
        }
        
        if (rpcData && rpcData.length >= 0) {
          console.log('RPC data found:', rpcData.length, 'payments');
          return rpcData as PaymentRecord[];
        }
        
        // If RPC returns null/undefined, return empty array
        console.warn('RPC returned null/undefined, returning empty array');
        return [];
        
      } catch (rpcError) {
        console.warn('RPC function failed, trying direct query:', rpcError);
        
        // Fallback to direct query with joins
        try {
          const { data: directData, error: directError } = await supabase
            .from('payments')
            .select(`
              payment_id,
              user_id,
              amount,
              currency,
              payment_status,
              payment_method,
              subscription_plan,
              billing_cycle,
              payment_date,
              order_number,
              invoice_id,
              transaction_id,
              admin_notes,
              created_at,
              app_users!inner(
                username,
                email
              ),
              subscription_plans(
                name
              )
            `)
            .order('payment_date', { ascending: false });

          if (directError) {
            console.error('Direct query error:', directError);
            throw directError;
          }

          console.log('Direct query data:', directData?.length || 0, 'payments');
          
          // Transform the data to match our interface
          const transformedData = directData?.map(payment => ({
            payment_id: payment.payment_id,
            user_id: payment.user_id,
            username: payment.app_users?.username || 'Unknown',
            email: payment.app_users?.email || 'Unknown',
            amount: payment.amount,
            currency: payment.currency,
            payment_status: payment.payment_status,
            payment_method: payment.payment_method || 'Unknown',
            subscription_plan: payment.subscription_plans?.name || payment.subscription_plan || 'Unknown',
            billing_cycle: payment.billing_cycle || 'Unknown',
            payment_date: payment.payment_date,
            order_number: payment.order_number || '',
            invoice_id: payment.invoice_id || '',
            transaction_id: payment.transaction_id || '',
            admin_notes: payment.admin_notes || '',
            created_at: payment.created_at,
          })) || [];

          return transformedData;
        } catch (directError) {
          console.error('Both RPC and direct query failed:', directError);
          // Return empty array on failure to prevent crashes
          return [];
        }
      }
    },
    meta: {
      onError: (error: any) => {
        console.error('Query error:', error);
        toast({
          title: "Error Loading Payments",
          description: `Failed to load payments: ${error.message}`,
          variant: "destructive",
        });
      }
    }
  });

  // Log the current state for debugging
  console.log('Payments hook state:', {
    paymentsCount: payments.length,
    isLoading,
    error: error?.message,
    searchTerm,
    filters: { planFilter, statusFilter, methodFilter, dateRange }
  });

  // Filter and sort payments
  const filteredPayments = useMemo(() => {
    // Ensure payments is always an array
    const safePayments = Array.isArray(payments) ? payments : [];
    
    let filtered = safePayments.filter(payment => {
      const matchesSearch = !searchTerm || 
        payment.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.invoice_id?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPlan = planFilter.length === 0 || planFilter.includes(payment.subscription_plan || '');
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(payment.payment_status);
      const matchesMethod = methodFilter.length === 0 || methodFilter.includes(payment.payment_method || '');

      // Date range filtering
      const matchesDateRange = !dateRange?.from || !dateRange?.to || 
        (new Date(payment.payment_date) >= dateRange.from && 
         new Date(payment.payment_date) <= dateRange.to);

      return matchesSearch && matchesPlan && matchesStatus && matchesMethod && matchesDateRange;
    });

    // Sort payments
    filtered.sort((a, b) => {
      const aValue = a[sortBy.key as keyof PaymentRecord];
      const bValue = b[sortBy.key as keyof PaymentRecord];
      
      if (sortBy.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [payments, searchTerm, planFilter, statusFilter, methodFilter, dateRange, sortBy]);

  // Paginate payments
  const paginatedPayments = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return filteredPayments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPayments, page]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  // Enhanced filter options that are always valid arrays
  const planOptions = useMemo(() => {
    const safePayments = Array.isArray(payments) ? payments : [];
    const uniquePlans = [...new Set(safePayments
      .map(p => p.subscription_plan)
      .filter(plan => plan && plan !== 'Unknown')
    )];
    
    // Predefined plans based on database subscription_plans table
    const predefinedPlans = [
      'Free Trial',
      'Starter',
      'Starter Monthly',
      'Starter Yearly', 
      'Pro',
      'Pro Monthly',
      'Pro Yearly',
      'Starter Monthly Plan',
      'Starter Yearly Plan', 
      'Pro Monthly Plan',
      'Pro Yearly Plan'
    ];
    
    const allPlans = [...new Set([...predefinedPlans, ...uniquePlans])];
    return allPlans.map(plan => ({ label: plan, value: plan }));
  }, [payments]);

  const statusOptions = useMemo(() => {
    const safePayments = Array.isArray(payments) ? payments : [];
    const uniqueStatuses = [...new Set(safePayments
      .map(p => p.payment_status)
      .filter(status => status)
    )];
    
    // Comprehensive payment statuses for the platform
    const predefinedStatuses = [
      'succeeded', 
      'completed',
      'failed', 
      'pending', 
      'cancelled',
      'refunded',
      'partially_refunded',
      'disputed',
      'chargeback',
      'expired',
      'processing',
      'requires_action',
      'requires_confirmation',
      'requires_payment_method'
    ];
    const allStatuses = [...new Set([...predefinedStatuses, ...uniqueStatuses])];
    
    return allStatuses.map(status => ({ 
      label: status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '), 
      value: status 
    }));
  }, [payments]);

  const methodOptions = useMemo(() => {
    const safePayments = Array.isArray(payments) ? payments : [];
    const uniqueMethods = [...new Set(safePayments
      .map(p => p.payment_method)
      .filter(method => method && method !== 'Unknown')
    )];
    
    // Comprehensive payment methods available on the platform
    const predefinedMethods = [
      'PayPal',
      'paypal_sandbox',
      'Crypto',
      'crypto',
      'UPI',
      'upi',
      'PhonePe',
      'phonepe',
      'Razorpay',
      'razorpay',
      'Stripe',
      'stripe',
      'Bank Transfer',
      'bank_transfer',
      'Credit Card',
      'credit_card',
      'Debit Card',
      'debit_card',
      'Digital Wallet',
      'digital_wallet',
      'Apple Pay',
      'apple_pay',
      'Google Pay',
      'google_pay',
      'Samsung Pay',
      'samsung_pay'
    ];
    const allMethods = [...new Set([...predefinedMethods, ...uniqueMethods])];
    
    return allMethods.map(method => ({ 
      label: method.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '), 
      value: method 
    }));
  }, [payments]);

  const handleExportCSV = () => {
    const csvContent = [
      ['Username', 'Email', 'Date', 'Plan', 'Amount', 'Currency', 'Method', 'Status', 'Order ID', 'Invoice ID', 'Admin Notes'].join(','),
      ...filteredPayments.map(payment => [
        payment.username || '',
        payment.email || '',
        payment.payment_date,
        payment.subscription_plan || '',
        payment.amount,
        payment.currency,
        payment.payment_method || '',
        payment.payment_status,
        payment.order_number || '',
        payment.invoice_id || '',
        `"${payment.admin_notes || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${filteredPayments.length} payment records.`,
    });
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    try {
      await Promise.all(
        selectedPayments.map(paymentId =>
          supabase.rpc('update_payment_status', {
            payment_id_param: paymentId,
            status_param: newStatus
          })
        )
      );
      
      setSelectedPayments([]);
      refetch();
      toast({
        title: "Bulk Update Complete",
        description: `Updated ${selectedPayments.length} payment(s) to ${newStatus}.`,
      });
    } catch (error) {
      toast({
        title: "Bulk Update Failed",
        description: "Failed to update payment statuses. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .in('payment_id', selectedPayments);

      if (error) throw error;

      setSelectedPayments([]);
      refetch();
      toast({
        title: "Bulk Delete Complete",
        description: `Deleted ${selectedPayments.length} payment(s).`,
      });
    } catch (error) {
      toast({
        title: "Bulk Delete Failed",
        description: "Failed to delete payments. Please try again.",
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPlanFilter([]);
    setStatusFilter([]);
    setMethodFilter([]);
    setDateRange(undefined);
    setPage(1);
  };

  return {
    payments,
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
    totalPayments: filteredPayments.length,
    handleExportCSV,
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
  };
};
