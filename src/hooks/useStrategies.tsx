
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

      // Get the internal user ID from app_users table
      const { data: appUser, error: appUserError } = await supabase
        .from("app_users")
        .select("user_id")
        .eq("auth_id", userData.user.id)
        .single();

      if (appUserError) {
        console.error("Error fetching internal user ID:", appUserError);
        throw new Error("Could not get user information");
      }

      if (!appUser) {
        throw new Error("User profile not found");
      }
      
      const { data, error } = await supabase
        .from("strategies")
        .select("*")
        .eq("user_id", appUser.user_id)
        .order("strategy_name", { ascending: true });
        
      if (error) throw error;
      
      setStrategies(data || []);
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

      // Get the internal user ID from app_users table
      const { data: appUser, error: appUserError } = await supabase
        .from("app_users")
        .select("user_id")
        .eq("auth_id", userData.user.id)
        .single();

      if (appUserError) {
        console.error("Error fetching internal user ID:", appUserError);
        throw new Error("Could not get user information");
      }

      if (!appUser) {
        throw new Error("User profile not found");
      }
      
      // First delete strategy rules associated with this strategy
      const { error: rulesError } = await supabase
        .from("strategy_rules")
        .delete()
        .eq("strategy_id", strategyId)
        .eq("user_id", appUser.user_id);
        
      if (rulesError) {
        console.error("Error deleting strategy rules:", rulesError);
        // Continue with strategy deletion even if rules deletion fails
      }
      
      // Then delete the strategy
      const { error: strategyError } = await supabase
        .from("strategies")
        .delete()
        .eq("strategy_id", strategyId)
        .eq("user_id", appUser.user_id);
        
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

      // Get the internal user ID from app_users table
      const { data: appUser, error: appUserError } = await supabase
        .from("app_users")
        .select("user_id")
        .eq("auth_id", userData.user.id)
        .single();

      if (appUserError) {
        console.error("Error fetching internal user ID:", appUserError);
        throw new Error("Could not get user information");
      }

      if (!appUser) {
        throw new Error("User profile not found");
      }
      
      const { error: createError } = await supabase
        .from("strategies")
        .insert({
          strategy_name: strategyData.strategy_name,
          description: strategyData.description,
          user_id: appUser.user_id
        });
        
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
