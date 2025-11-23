
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StrategyRule } from "@/components/strategies/StrategyRulesList";

export function useStrategyRules(strategyId: string | null) {
  const [rules, setRules] = useState<StrategyRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = async () => {
    if (!strategyId) {
      setRules([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error(userError.message);
      }
      
      const authUserId = userData.user?.id;
      
      if (!authUserId) {
        throw new Error("User not authenticated");
      }
      
      // Get internal user ID from app_users table
      const { data: appUser, error: appUserError } = await supabase
        .from("app_users")
        .select("user_id")
        .eq("auth_id", authUserId)
        .single();
        
      if (appUserError) {
        console.error("Error fetching internal user ID:", appUserError);
        throw new Error("Could not get user information");
      }
      
      if (!appUser) {
        throw new Error("User profile not found");
      }
      
      // Make a substantive change: improved query with explicit type checking
      const { data, error } = await supabase
        .from("strategy_rules")
        .select("rule_id, rule_title, rule_description, rule_type, strategy_id, user_id")
        .eq("strategy_id", strategyId)
        .eq("user_id", appUser.user_id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Add explicit typing and null handling
      const typedRules = (data || []).map(rule => ({
        rule_id: rule.rule_id,
        rule_title: rule.rule_title,
        rule_description: rule.rule_description || "",
        rule_type: rule.rule_type as "entry" | "exit" | "management",
        strategy_id: rule.strategy_id,
        user_id: rule.user_id
      }));
      
      setRules(typedRules);
    } catch (err) {
      console.error("Error fetching strategy rules:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch strategy rules");
      toast.error("Failed to load strategy rules");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [strategyId]);

  return {
    rules,
    isLoading,
    error,
    refetch: fetchRules
  };
}
