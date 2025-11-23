
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
          const planName = accessData.planName || 'Unknown';
          const isPro = planName.toLowerCase().includes('pro');
          
          // Ensure accessBlocked is properly handled
          const accessBlocked = accessData.accessBlocked !== undefined 
            ? Boolean(accessData.accessBlocked) 
            : !Boolean(accessData.isActive);
          
          return {
            notes: Boolean(accessData.notes),
            accountsLimit: isPro ? -1 : (accessData.accountsLimit || 0), // -1 means unlimited
            strategiesLimit: isPro ? -1 : (accessData.strategiesLimit || 0), // -1 means unlimited
            gennie: Boolean(accessData.gennie || isPro),
            profile: Boolean(accessData.profile),
            accessBlocked: accessBlocked,
            planName: planName,
            isActive: Boolean(accessData.isActive)
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
