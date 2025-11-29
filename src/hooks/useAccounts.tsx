
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "sonner";

export interface Account {
  account_id: string;
  account_name: string;
  type: string;
  broker: string | null;
  current_balance: number;
  starting_balance: number;
  profit_loss: number | null;
  status: string;
  commission: number | null;
  fees: number | null;
  user_id: string | null;
  created_on: string | null;
}

export interface AccountFormValues {
  account_name: string;
  type: string;
  broker?: string | null;
  starting_balance: number;
  current_balance: number;
  status: string;
  commission?: number | null;
  fees?: number | null;
}

export function useAccounts() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const queryClient = useQueryClient();

  // Get user ID from auth context
  const userId = user?.id;

  const fetchAccounts = async (): Promise<Account[]> => {
    if (!userId) {
      console.log('No user ID available for accounts');
      return [];
    }

    console.log('Fetching accounts for user ID:', userId);

    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", userId);
    
    // Map database fields to frontend interface
    const mappedData = data?.map((account: any) => ({
      account_id: account.id,
      account_name: account.name,
      type: account.account_type,
      broker: account.broker,
      current_balance: account.current_balance,
      starting_balance: account.initial_balance,
      profit_loss: account.profit_loss,
      status: account.is_active ? 'active' : 'inactive',
      commission: account.commission,
      fees: account.fees,
      user_id: account.user_id,
      created_on: account.created_at
    })).sort((a, b) => a.account_name.localeCompare(b.account_name));

    if (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
    
    console.log('Accounts fetched successfully:', mappedData);
    return mappedData || [];
  };

  const createAccount = async (account: AccountFormValues): Promise<Account> => {
    if (!userId) throw new Error("User not authenticated");

    // Map old field names to new schema
    const accountData = {
      user_id: userId,
      name: account.account_name,
      broker: account.broker,
      account_type: account.type,
      initial_balance: account.starting_balance,
      current_balance: account.current_balance,
      is_active: account.status === 'active' || account.status === 'Active',
      currency: 'USD'
    };

    const { data, error } = await supabase
      .from("accounts")
      .insert([accountData] as any)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateAccount = async ({ account_id, accountData }: { account_id: string; accountData: Partial<AccountFormValues> }): Promise<Account> => {
    if (!userId) throw new Error("User not authenticated");

    // Map old field names to new schema
    const updateData: any = {};
    if (accountData.account_name !== undefined) updateData.name = accountData.account_name;
    if (accountData.broker !== undefined) updateData.broker = accountData.broker;
    if (accountData.type !== undefined) updateData.account_type = accountData.type;
    if (accountData.starting_balance !== undefined) updateData.initial_balance = accountData.starting_balance;
    if (accountData.current_balance !== undefined) updateData.current_balance = accountData.current_balance;
    if (accountData.status !== undefined) updateData.is_active = accountData.status === 'active' || accountData.status === 'Active';

    const { data, error } = await supabase
      .from("accounts")
      .update(updateData as any)
      .eq("id", account_id) // Use 'id' for new schema
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteAccount = async (account_id: string): Promise<void> => {
    if (!userId) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("accounts")
      .delete()
      .eq("id", account_id) // Use 'id' for new schema (account_id is generated column)
      .eq("user_id", userId);

    if (error) throw error;
  };

  const accountsQuery = useQuery({
    queryKey: ["accounts", userId],
    queryFn: fetchAccounts,
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
  });

  const createAccountMutation = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", userId] });
      toast.success("Account created successfully");
    },
    onError: (error: any) => {
      console.error('Error in createAccountMutation:', error);
      toast.error(error.message || "Failed to create account");
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: updateAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", userId] });
      toast.success("Account updated successfully");
    },
    onError: (error: any) => {
      console.error('Error in updateAccountMutation:', error);
      toast.error(error.message || "Failed to update account");
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", userId] });
      toast.success("Account deleted successfully");
    },
    onError: (error: any) => {
      console.error('Error in deleteAccountMutation:', error);
      toast.error(error.message || "Failed to delete account");
    },
  });

  return {
    accounts: accountsQuery.data || [],
    isLoading: accountsQuery.isLoading,
    isError: accountsQuery.isError,
    error: accountsQuery.error,
    createAccount: createAccountMutation.mutate,
    updateAccount: updateAccountMutation.mutate,
    deleteAccount: deleteAccountMutation.mutate,
    refetch: accountsQuery.refetch,
  };
}
