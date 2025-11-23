import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

/**
 * Hook to get the app_users.user_id for the current authenticated user
 * This is needed because some tables reference app_users.user_id instead of auth.users.id
 */
export const useAppUserId = () => {
  const [appUserId, setAppUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchAppUserId = async () => {
      if (!user) {
        setAppUserId(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('app_users')
          .select('user_id')
          .eq('auth_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching app user ID:', error);
          setAppUserId(null);
        } else {
          setAppUserId(data.user_id);
        }
      } catch (error) {
        console.error('Error fetching app user ID:', error);
        setAppUserId(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppUserId();
  }, [user]);

  return { appUserId, isLoading };
};