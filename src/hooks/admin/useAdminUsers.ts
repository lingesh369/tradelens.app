import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllUsers, deleteUser, updateUserStatus } from '@/lib/admin-utils';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { exportToCSV } from '@/utils/csvExport';
import { adminUserColumns } from '@/components/admin/users/AdminUserTableColumns';

// Define User type with additional fields
export interface User {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  user_status: string;
  user_role: string;
  signup_date: string;
  last_login: string | null;
  subscription_plan: string;
  trial_active: boolean;
  
  // Additional subscription fields
  next_billing_date: string | null;
  end_date: string | null;
  
  // Trading metrics
  net_pl: number | null;
  win_rate: number | null;
  trades_count: number | null;
  last_trade_date: string | null;
  accounts_count: number | null;
  strategies_count: number | null;
  
  // User preferences
  base_currency: string | null;
  time_zone: string | null;
  dark_mode: boolean | null;
}

const fetchEnhancedUserData = async (): Promise<User[]> => {
  console.log('Fetching enhanced user data...');
  
  const { data: users, error } = await fetchAllUsers();
  if (error) {
    console.error('Error fetching users:', error);
    throw new Error(error as any);
  }
  
  if (!users || users.length === 0) {
    console.log('No users found');
    return [];
  }
  
  console.log(`Found ${users.length} users, enhancing data...`);
  
  // Get enhanced user data with subscription details, trading metrics, and preferences
  const { data: enhancedUsers, error: enhancedError } = await supabase
    .from('app_users')
    .select(`
      *,
      user_subscriptions_new!inner (
        next_billing_date,
        end_date,
        subscription_plans!inner (
          name
        )
      ),
      user_settings (
        settings_data
      )
    `);
    
  if (enhancedError) {
    console.error('Error fetching enhanced user data:', enhancedError);
  }
  
  // Get trading metrics for all users
  const userIds = users.map(u => u.user_id);
  const { data: tradingMetrics } = await supabase
    .from('trade_metrics')
    .select(`
      user_id,
      net_p_and_l,
      trade_outcome
    `)
    .in('user_id', userIds);
    
  // Get last trade date for all users
  const { data: lastTrades } = await supabase
    .from('trades')
    .select('user_id, entry_time')
    .in('user_id', userIds)
    .order('entry_time', { ascending: false });
    
  // Get accounts count
  const { data: accountsCounts } = await supabase
    .from('accounts')
    .select('user_id')
    .in('user_id', userIds);
    
  // Get strategies count
  const { data: strategiesCounts } = await supabase
    .from('strategies')
    .select('user_id')
    .in('user_id', userIds);
  
  console.log('Processing and merging all data...');
  
  // Process and merge all data
  const processedUsers = users.map(user => {
    const enhanced = enhancedUsers?.find(eu => eu.id === user.user_id);
    const subscription = enhanced?.user_subscriptions_new?.[0];
    const settings = enhanced?.user_settings?.[0]?.settings_data as any;
    
    // Calculate trading metrics
    const userTrades = tradingMetrics?.filter(tm => tm.user_id === user.user_id) || [];
    const totalPnL = userTrades.reduce((sum, trade) => sum + (trade.net_p_and_l || 0), 0);
    const winningTrades = userTrades.filter(trade => trade.trade_outcome === 'WIN').length;
    const winRate = userTrades.length > 0 ? (winningTrades / userTrades.length) * 100 : 0;
    
    // Get last trade date for this user
    const userLastTrades = lastTrades?.filter(lt => lt.user_id === user.user_id) || [];
    const lastTradeDate = userLastTrades.length > 0 ? userLastTrades[0].entry_time : null;
    
    // Count accounts and strategies
    const accountsCount = accountsCounts?.filter(ac => ac.user_id === user.user_id).length || 0;
    const strategiesCount = strategiesCounts?.filter(sc => sc.user_id === user.user_id).length || 0;
    
    return {
      ...user,
      subscription_plan: subscription?.subscription_plans?.name || user.subscription_plan || 'Free Trial',
      next_billing_date: subscription?.next_billing_date || null,
      end_date: subscription?.end_date || null,
      net_pl: totalPnL,
      win_rate: winRate,
      trades_count: userTrades.length,
      last_trade_date: lastTradeDate,
      accounts_count: accountsCount,
      strategies_count: strategiesCount,
      base_currency: settings?.base_currency || 'USD',
      time_zone: settings?.time_zone || 'UTC',
      dark_mode: settings?.dark_mode || false,
    };
  });
  
  console.log('Enhanced user data processed successfully');
  return processedUsers;
};

// New function to fetch user metrics
const fetchUserMetrics = async () => {
  const { data: users } = await supabase
    .from('app_users')
    .select('created_at, user_status')
    .eq('user_status', 'Active');

  const { data: subscriptions } = await supabase
    .from('user_subscriptions_new')
    .select(`
      subscription_plans!inner (name)
    `)
    .eq('status', 'active');

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Calculate new users in last 30 days
  const newUsers = users?.filter(user => 
    new Date(user.created_at) >= thirtyDaysAgo
  ).length || 0;

  // Calculate active trials
  const activeTrials = subscriptions?.filter(sub => 
    sub.end_date && 
    new Date(sub.end_date) > now &&
    sub.subscription_plans.name === 'Free Trial'
  ).length || 0;

  // Calculate paid conversions (users who moved from trial to paid in last 30 days)
  const { data: paidConversions } = await supabase
    .from('user_subscriptions_new')
    .select(`
      created_at,
      subscription_plans!inner (name)
    `)
    .neq('subscription_plans.name', 'Free Trial')
    .eq('status', 'active')
    .gte('created_at', thirtyDaysAgo.toISOString());

  return {
    newUsers,
    activeTrials,
    paidConversions: paidConversions?.length || 0
  };
};

export const useAdminUsers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load saved column preferences
  const [selectedColumns, setSelectedColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('adminUsersSelectedColumns');
    return saved ? JSON.parse(saved) : [
      'username', 'email', 'subscription_plan', 'signup_date', 'last_login', 'user_role', 'user_status'
    ];
  });

  // Save column preferences whenever they change
  useEffect(() => {
    localStorage.setItem('adminUsersSelectedColumns', JSON.stringify(selectedColumns));
  }, [selectedColumns]);

  // State for filters, search, and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [planFilter, setPlanFilter] = useState('All');
  const [sortBy, setSortBy] = useState({ key: 'signup_date', direction: 'desc' });
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  
  // State for modals
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSuspendModalOpen, setSuspendModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetching users data with enhanced information
  const { data: users = [], isLoading: isLoadingUsers, error: usersError } = useQuery({
    queryKey: ['adminAllUsersEnhanced'],
    queryFn: fetchEnhancedUserData,
    staleTime: 30000,
  });

  // Fetching user metrics
  const { data: metrics } = useQuery({
    queryKey: ['adminUserMetrics'],
    queryFn: fetchUserMetrics,
    staleTime: 60000, // Cache for 1 minute
  });

  // Memoized and filtered data
  const filteredUsers = useMemo(() => {
    let result = users;

    // Search
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      result = result.filter(user =>
        user.email.toLowerCase().includes(lowercasedTerm) ||
        (user.username && user.username.toLowerCase().includes(lowercasedTerm)) ||
        `${user.first_name || ''} ${user.last_name || ''}`.trim().toLowerCase().includes(lowercasedTerm)
      );
    }

    // Filter by status
    if (statusFilter !== 'All') {
      result = result.filter(user => user.user_status === statusFilter);
    }

    // Filter by plan
    if (planFilter !== 'All') {
      result = result.filter(user => user.subscription_plan === planFilter);
    }
    
    // Sorting
    result.sort((a, b) => {
      const aVal = a[sortBy.key as keyof User] ?? '';
      const bVal = b[sortBy.key as keyof User] ?? '';
      if (aVal < bVal) return sortBy.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortBy.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, searchTerm, statusFilter, planFilter, sortBy]);

  // Paginated data
  const paginatedUsers = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, page, itemsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Mutations
  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast({ title: 'Success', description: 'User deleted successfully.' });
      queryClient.invalidateQueries({ queryKey: ['adminAllUsersEnhanced'] });
    },
    onError: (error) => {
      toast({ title: 'Error', description: `Failed to delete user: ${error.message}`, variant: 'destructive' });
    }
  });
  
  const suspendUserMutation = useMutation({
    mutationFn: (variables: { userId: string, status: string }) => updateUserStatus(variables.userId, variables.status),
    onSuccess: () => {
      toast({ title: 'Success', description: 'User status updated successfully.' });
      queryClient.invalidateQueries({ queryKey: ['adminAllUsersEnhanced'] });
    },
    onError: (error) => {
      toast({ title: 'Error', description: `Failed to update user status: ${error.message}`, variant: 'destructive' });
    }
  });
  
  // Handlers for modals
  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };
  
  const openSuspendModal = (user: User) => {
    setSelectedUser(user);
    setSuspendModalOpen(true);
  };

  const closeModals = () => {
    setDeleteModalOpen(false);
    setSuspendModalOpen(false);
    setSelectedUser(null);
  };
  
  const handleDeleteUser = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.user_id);
      closeModals();
    }
  };
  
  const handleSuspendUser = () => {
    if (selectedUser) {
      const newStatus = selectedUser.user_status === 'Active' ? 'Suspended' : 'Active';
      suspendUserMutation.mutate({ userId: selectedUser.user_id, status: newStatus });
      closeModals();
    }
  };
  
  const handleExportCSV = () => {
    if (filteredUsers.length === 0) {
      toast({ 
        title: 'No Data', 
        description: 'No users found to export.',
        variant: 'destructive'
      });
      return;
    }

    try {
      exportToCSV(
        filteredUsers,
        `tradelens-users-${new Date().toISOString().split('T')[0]}.csv`,
        selectedColumns,
        adminUserColumns
      );
      
      toast({ 
        title: 'Success', 
        description: `Exported ${filteredUsers.length} users to CSV.` 
      });
    } catch (error) {
      console.error('CSV Export Error:', error);
      toast({ 
        title: 'Export Failed', 
        description: 'There was an error exporting the data.',
        variant: 'destructive'
      });
    }
  };

  return {
    users,
    paginatedUsers,
    isLoading: isLoadingUsers,
    usersError,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    planFilter,
    setPlanFilter,
    sortBy,
    setSortBy,
    page,
    setPage,
    totalPages,
    selectedColumns,
    setSelectedColumns,
    openDeleteModal,
    openSuspendModal,
    isDeleteModalOpen,
    isSuspendModalOpen,
    closeModals,
    selectedUser,
    handleDeleteUser,
    handleSuspendUser,
    handleExportCSV,
    totalUsers: filteredUsers.length,
    metrics: metrics || { newUsers: 0, activeTrials: 0, paidConversions: 0 }
  };
};
