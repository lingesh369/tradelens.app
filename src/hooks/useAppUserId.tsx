import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

/**
 * Hook to get the app_users.id for the current authenticated user
 * In this schema, app_users.id is the same as auth.users.id (direct reference)
 * This hook verifies the user exists in app_users table
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
        // In this schema, app_users.id = auth.users.id
        // Just verify the user exists in app_users
        const { data, error } = await supabase
          .from('app_users')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching app user ID:', error);
          setAppUserId(null);
        } else if (data) {
          // User exists in app_users, use their ID
          setAppUserId(data.id);
        } else {
          // User not found in app_users yet (might be during signup)
          console.warn('User not found in app_users, profile may still be creating');
          setAppUserId(null);
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
