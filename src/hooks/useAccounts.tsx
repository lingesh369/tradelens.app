
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

  const fetchAccounts = async (): Promise<Account[]> => {
    if (!profile?.user_id) {
      console.log('No profile user_id available for accounts');
      return [];
    }

    console.log('Fetching accounts for profile ID:', profile.user_id);

    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", profile.user_id)
      .order("account_name", { ascending: true });

    if (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
    
    console.log('Accounts fetched successfully:', data);
    return data || [];
  };

  const createAccount = async (account: AccountFormValues): Promise<Account> => {
    if (!profile?.user_id) throw new Error("User profile not loaded");

    const { data, error } = await supabase
      .from("accounts")
      .insert([{ ...account, user_id: profile.user_id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateAccount = async ({ account_id, accountData }: { account_id: string; accountData: Partial<AccountFormValues> }): Promise<Account> => {
    if (!profile?.user_id) throw new Error("User profile not loaded");

    const { data, error } = await supabase
      .from("accounts")
      .update(accountData)
      .eq("account_id", account_id)
      .eq("user_id", profile.user_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteAccount = async (account_id: string): Promise<void> => {
    if (!profile?.user_id) throw new Error("User profile not loaded");

    const { error } = await supabase
      .from("accounts")
      .delete()
      .eq("account_id", account_id)
      .eq("user_id", profile.user_id);

    if (error) throw error;
  };

  const accountsQuery = useQuery({
    queryKey: ["accounts", profile?.user_id],
    queryFn: fetchAccounts,
    enabled: !!profile?.user_id,
    staleTime: 1000 * 60, // 1 minute
  });

  const createAccountMutation = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", profile?.user_id] });
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
      queryClient.invalidateQueries({ queryKey: ["accounts", profile?.user_id] });
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
      queryClient.invalidateQueries({ queryKey: ["accounts", profile?.user_id] });
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
