
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useStrategies } from '@/hooks/useStrategies';

export const useStrategyLimits = () => {
  const { user } = useAuth();
  const { strategies } = useStrategies();
  const [strategiesLimit, setStrategiesLimit] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStrategiesLimit = async () => {
    if (!user) {
      setStrategiesLimit(0);
      setIsLoading(false);
      return;
    }

    try {
      // Use the centralized get_user_access_matrix function
      const { data: accessData, error: accessError } = await supabase
        .rpc('get_user_access_matrix', { auth_user_id: user.id });

      if (accessError || !accessData || (Array.isArray(accessData) && accessData.length === 0)) {
        console.log('No access data found, using Free Trial defaults');
        setStrategiesLimit(3); // Free Trial default
      } else {
        const userAccess: any = Array.isArray(accessData) ? accessData[0] : accessData;
        // Use snake_case from database (strategieslimit) with fallback to camelCase
        const limit = userAccess.strategieslimit ?? userAccess.strategiesLimit ?? 3;
        console.log('Strategies limit from DB:', limit);
        setStrategiesLimit(limit);
      }
    } catch (error) {
      console.error('Error fetching strategies limit:', error);
      setStrategiesLimit(3); // Default to Free Trial limit
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategiesLimit();
  }, [user]);

  const currentStrategiesCount = strategies.length;
  // -1 means unlimited
  const canCreateStrategy = strategiesLimit === -1 || currentStrategiesCount < strategiesLimit;
  const strategiesRemaining = strategiesLimit === -1 ? Infinity : Math.max(0, strategiesLimit - currentStrategiesCount);

  return {
    strategiesLimit,
    currentStrategiesCount,
    canCreateStrategy,
    strategiesRemaining,
    isLoading,
    refetch: fetchStrategiesLimit
  };
};
