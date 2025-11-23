
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/components/ui/use-toast";

export interface Commission {
  commission_id: string;
  user_id: string;
  account_id: string | null;
  market_type: string;
  broker: string | null;
  commission: number;
  fees: number;
  total_fees: number;
  created_at: string;
}

export interface CommissionFormValues {
  market_type: string;
  commission: number;
  fees: number;
  broker?: string | null;
  account_id?: string | null;
}

export function useCommissions() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get user ID from auth context
  const userId = user?.id;

  const fetchCommissions = async (): Promise<Commission[]> => {
    if (!userId) {
      console.log('No user ID available for commissions');
      return [];
    }

    console.log('Fetching commissions for user ID:', userId);

    const { data, error } = await supabase
      .from("commissions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error('Error fetching commissions:', error);
      throw error;
    }
    
    console.log('Commissions fetched successfully:', data);
    return data || [];
  };

  const createCommission = async (commission: CommissionFormValues): Promise<Commission> => {
    if (!userId) throw new Error("User not authenticated");

    const totalFees = commission.commission + commission.fees;

    const { data, error } = await supabase
      .from("commissions")
      .insert([{ 
        ...commission, 
        user_id: userId,
        total_fees: totalFees
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateCommission = async ({ commission_id, ...commissionData }: { commission_id: string } & Partial<CommissionFormValues>): Promise<Commission> => {
    if (!userId) throw new Error("User not authenticated");

    // Prepare update data - only include the form fields
    const updateData: any = { ...commissionData };
    
    // Calculate total_fees if both commission and fees are provided
    if (commissionData.commission !== undefined && commissionData.fees !== undefined) {
      updateData.total_fees = commissionData.commission + commissionData.fees;
    }

    const { data, error } = await supabase
      .from("commissions")
      .update(updateData)
      .eq("commission_id", commission_id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteCommission = async (commission_id: string): Promise<void> => {
    if (!userId) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("commissions")
      .delete()
      .eq("commission_id", commission_id)
      .eq("user_id", userId);

    if (error) throw error;
  };

  const commissionsQuery = useQuery({
    queryKey: ["commissions", userId],
    queryFn: fetchCommissions,
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
  });

  const createCommissionMutation = useMutation({
    mutationFn: createCommission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions", userId] });
      toast({
        title: "Commission structure added successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error in createCommissionMutation:', error);
      toast({
        title: "Error adding commission structure",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCommissionMutation = useMutation({
    mutationFn: updateCommission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions", userId] });
      toast({
        title: "Commission structure updated successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error in updateCommissionMutation:', error);
      toast({
        title: "Error updating commission structure",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCommissionMutation = useMutation({
    mutationFn: deleteCommission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions", userId] });
      toast({
        title: "Commission structure deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error in deleteCommissionMutation:', error);
      toast({
        title: "Error deleting commission structure",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    commissions: commissionsQuery.data || [],
    isLoading: commissionsQuery.isLoading,
    isError: commissionsQuery.isError,
    error: commissionsQuery.error,
    createCommission: createCommissionMutation.mutate,
    updateCommission: updateCommissionMutation.mutate,
    deleteCommission: deleteCommissionMutation.mutate,
    refetch: commissionsQuery.refetch,
  };
}
