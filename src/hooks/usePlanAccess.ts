
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface PlanAccess {
  notes: boolean;
  accountsLimit: number;
  strategiesLimit: number;
  gennie: boolean;
  profile: boolean;
  accessBlocked: boolean;
  planName: string;
  isActive: boolean;
}

export const usePlanAccess = () => {
  const { user } = useAuth();

  const fetchAccess = async (): Promise<PlanAccess> => {
    if (!user) {
      return {
        notes: false,
        accountsLimit: 0,
        strategiesLimit: 0,
        gennie: false,
        profile: false,
        accessBlocked: true,
        planName: 'Not Logged In',
        isActive: false
      };
    }

    try {
      // Use the corrected get_user_access_matrix function
      const { data, error } = await supabase.rpc('get_user_access_matrix', {
        auth_user_id: user.id
      });

      if (error) {
        console.error('Error fetching plan access:', error);
        // Return Free Trial defaults if function call fails
        return {
          notes: false,
          accountsLimit: 1,
          strategiesLimit: 3,
          gennie: false,
          profile: true,
          accessBlocked: true, // Changed to true for error cases
          planName: 'Free Trial',
          isActive: false
        };
      }

      if (data) {
        // Handle both array response (TABLE) and direct object response (JSONB)
        const accessData = Array.isArray(data) ? (data.length > 0 ? data[0] : null) : data;
        
        if (accessData) {
          // Use snake_case column names from PostgreSQL
          const planName = accessData.plan_name || 'Unknown';
          const isPro = planName.toLowerCase().includes('pro');
          
          // Use snake_case column names from PostgreSQL
          const isActive = accessData.isactive ?? false;
          const accessBlocked = accessData.accessblocked ?? false;
          const notesAccess = accessData.notesaccess ?? false;
          const profileAccess = accessData.profileaccess ?? false;
          const aiAccess = accessData.aiaccess ?? false;
          const accountsLimit = accessData.accountslimit ?? 0;
          const strategiesLimit = accessData.strategieslimit ?? 0;
          
          console.log('Plan Access Data:', {
            planName,
            isActive,
            accessBlocked,
            notesAccess,
            profileAccess
          });
          
          return {
            notes: Boolean(notesAccess),
            accountsLimit: isPro ? -1 : accountsLimit, // -1 means unlimited
            strategiesLimit: isPro ? -1 : strategiesLimit, // -1 means unlimited
            gennie: Boolean(aiAccess || isPro),
            profile: Boolean(profileAccess),
            accessBlocked: accessBlocked,
            planName: planName,
            isActive: isActive
          };
        }
      }
      
      // No data found, return Free Trial defaults
      return {
        notes: false,
        accountsLimit: 1,
        strategiesLimit: 3,
        gennie: false,
        profile: true,
        accessBlocked: true, // Changed to true for no data cases
        planName: 'Free Trial',
        isActive: false
      };
    } catch (error) {
      console.error('Error fetching plan access:', error);
      // Return a default error state with Free Trial access
      return {
        notes: false,
        accountsLimit: 1,
        strategiesLimit: 3,
        gennie: false,
        profile: true,
        accessBlocked: true, // Changed to true for error cases
        planName: 'Free Trial',
        isActive: false
      };
    }
  };
  
  const { data: access, isLoading, refetch } = useQuery({
    queryKey: ['plan-access', user?.id],
    queryFn: fetchAccess,
    enabled: !!user,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refetch every 30 seconds to catch admin changes
  });

  return { access, isLoading, refetch };
};
