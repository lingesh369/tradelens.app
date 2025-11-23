
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

      if (accessError || !accessData || accessData.length === 0) {
        console.log('No access data found, using Free Trial defaults');
        setStrategiesLimit(3); // Free Trial default
      } else {
        const userAccess = accessData[0];
        const limit = userAccess.strategiesLimit || 3;
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
  const canCreateStrategy = currentStrategiesCount < strategiesLimit;
  const strategiesRemaining = Math.max(0, strategiesLimit - currentStrategiesCount);

  return {
    strategiesLimit,
    currentStrategiesCount,
    canCreateStrategy,
    strategiesRemaining,
    isLoading,
    refetch: fetchStrategiesLimit
  };
};
