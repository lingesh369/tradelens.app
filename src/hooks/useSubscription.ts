import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { UserSubscription } from '@/lib/types/subscription';

export interface SubscriptionPlan {
  id: string;
  plan_id: string;
  name: string;
  display_name: string;
  description: string | null;
  monthly_price: number;
  yearly_price: number;
  features: any;
  limits: any;
}

export function useSubscription() {
  const { user } = useAuth();

  const subscriptionQuery = useQuery<UserSubscription | null>({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_subscriptions' as any)
        .select(`
          *,
          subscription_plans!inner(
            name,
            display_name,
            features
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }

      return data as any as UserSubscription;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const plansQuery = useQuery<SubscriptionPlan[]>({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans' as any)
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching plans:', error);
        return [];
      }

      return ((data as any) || []).map((plan: any) => ({
        id: plan.id,
        plan_id: plan.id,
        name: plan.display_name || plan.name,
        display_name: plan.display_name,
        description: plan.description,
        monthly_price: plan.price_monthly || 0,
        yearly_price: plan.price_yearly || 0,
        features: plan.features,
        limits: plan.limits
      }));
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const paymentHistoryQuery = useQuery({
    queryKey: ['payment-history', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('payment_history' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment history:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    data: subscriptionQuery.data,
    isLoading: subscriptionQuery.isLoading,
    error: subscriptionQuery.error,
    refetch: subscriptionQuery.refetch,
    // Backward compatibility
    userSubscription: subscriptionQuery.data,
    // Plans data
    plans: plansQuery.data || [],
    isLoadingPlans: plansQuery.isLoading,
    plansError: plansQuery.error,
    // Payment history
    paymentHistory: paymentHistoryQuery.data || [],
    isLoadingPayments: paymentHistoryQuery.isLoading,
    paymentsError: paymentHistoryQuery.error
  };
}
