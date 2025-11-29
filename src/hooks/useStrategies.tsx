
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Strategy {
  strategy_id: string;
  strategy_name: string;
  description: string | null;
  total_trades: number | null;
  wins: number | null;
  losses: number | null;
  win_rate: number | null;
  net_pl: number | null;
  user_id: string | null;
  notes: string | null;
}

export function useStrategies() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStrategies = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error(userError.message);
      }
      
      if (!userData.user) {
        throw new Error("User not authenticated");
      }

      // The user.id from auth IS the user_id in app_users and other tables
      const userId = userData.user.id;
      
      const { data, error } = await supabase
        .from("strategies")
        .select("*")
        .eq("user_id", userId);
        
      if (error) throw error;
      
      // Map database fields to frontend interface
      const mappedData = data?.map((strategy: any) => ({
        strategy_id: strategy.id,
        strategy_name: strategy.name,
        description: strategy.description,
        total_trades: strategy.total_trades,
        wins: strategy.winning_trades,
        losses: strategy.losing_trades,
        win_rate: strategy.win_rate,
        net_pl: strategy.total_pnl,
        user_id: strategy.user_id,
        notes: strategy.notes
      })).sort((a, b) => a.strategy_name.localeCompare(b.strategy_name));
      
      setStrategies(mappedData || []);
    } catch (err) {
      console.error("Error fetching strategies:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch strategies");
      toast.error("Failed to load strategies");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteStrategy = async (strategyId: string) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error(userError.message);
      }
      
      if (!userData.user) {
        throw new Error("User not authenticated");
      }

      // The user.id from auth IS the user_id in app_users and other tables
      const userId = userData.user.id;
      
      // First delete strategy rules associated with this strategy (use 'id' for new schema)
      const { error: rulesError } = await supabase
        .from("strategy_rules")
        .delete()
        .eq("strategy_id", strategyId) // strategy_id is the foreign key, keep as is
        .eq("user_id", userId);
        
      if (rulesError) {
        console.error("Error deleting strategy rules:", rulesError);
        // Continue with strategy deletion even if rules deletion fails
      }
      
      // Then delete the strategy (use 'id' for new schema)
      const { error: strategyError } = await supabase
        .from("strategies")
        .delete()
        .eq("id", strategyId) // Use 'id' instead of 'strategy_id'
        .eq("user_id", userId);
        
      if (strategyError) throw strategyError;
      
      toast.success("Strategy deleted successfully");
      await fetchStrategies();
    } catch (err) {
      console.error("Error deleting strategy:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete strategy");
    }
  };

  useEffect(() => {
    fetchStrategies();
  }, []);

  const createStrategy = async (strategyData: { strategy_name: string; description?: string | null }) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error(userError.message);
      }
      
      if (!userData.user) {
        throw new Error("User not authenticated");
      }

      // The user.id from auth IS the user_id in app_users and other tables
      const userId = userData.user.id;
      
      // Map old field names to new schema
      const { error: createError } = await supabase
        .from("strategies")
        .insert([{
          name: strategyData.strategy_name,
          description: strategyData.description,
          user_id: userId,
          is_active: true,
          is_public: false,
          total_trades: 0,
          winning_trades: 0,
          losing_trades: 0,
          win_rate: 0,
          total_pnl: 0
        }] as any);
        
      if (createError) throw createError;
      
      toast.success("Strategy created successfully");
      await fetchStrategies();
    } catch (err) {
      console.error("Error creating strategy:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create strategy");
      throw err;
    }
  };

  return {
    strategies,
    isLoading,
    error,
    refetch: fetchStrategies,
    deleteStrategy,
    createStrategy
  };
}
