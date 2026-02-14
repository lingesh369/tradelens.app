import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsAccess {
  canAccessAnalytics: boolean;
  canAccessAllTabs: boolean;
  planName: string;
  isLoading: boolean;
}

export const useAnalyticsAccess = (): AnalyticsAccess => {
  const { user } = useAuth();

  const fetchAnalyticsAccess = async (): Promise<Omit<AnalyticsAccess, 'isLoading'>> => {
    if (!user) {
      return {
        canAccessAnalytics: false,
        canAccessAllTabs: false,
        planName: 'Not Logged In'
      };
    }

    try {
      // Get current subscription - user.id is the same as app_users.id
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (
            name
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let planName = 'Free Trial';
      
      if (!subError && subData?.subscription_plans?.name) {
        planName = subData.subscription_plans.name;
      }

      // New access control logic:
      // - Free and Pro plans: full access to analytics page and all tabs
      // - Starter plan: access to analytics page but only overview tab
      const normalizedPlanName = planName.toLowerCase();
      
      const canAccessAnalytics = true; // All plans can access analytics page
      const canAccessAllTabs = normalizedPlanName.includes('free') || 
                              normalizedPlanName.includes('pro') || 
                              normalizedPlanName.includes('trial');

      return {
        canAccessAnalytics,
        canAccessAllTabs,
        planName
      };
    } catch (error) {
      console.error('Error fetching analytics access:', error);
      // Default to Free Trial access when there's an error
      return {
        canAccessAnalytics: true,
        canAccessAllTabs: true,
        planName: 'Free Trial'
      };
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['analytics-access', user?.id],
    queryFn: fetchAnalyticsAccess,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    canAccessAnalytics: data?.canAccessAnalytics ?? false,
    canAccessAllTabs: data?.canAccessAllTabs ?? false,
    planName: data?.planName ?? 'Loading...',
    isLoading
  };
};
