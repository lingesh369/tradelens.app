import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { 
  SubscriptionPlan, 
  UserSubscription, 
  PaymentHistory,
  SubscriptionFormValues
} from "@/types/subscription";
import { useState, useEffect } from "react";

export const useSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!user) return;

    const getInternalUserId = async () => {
      const { data: userData } = await supabase
        .from("app_users")
        .select("user_id")
        .eq("auth_id", user.id)
        .single();
      return userData?.user_id;
    };

    let subscriptionChannel: any;
    let paymentChannel: any;

    const setupChannels = async () => {
      const internalUserId = await getInternalUserId();
      if (!internalUserId) return;

      subscriptionChannel = supabase.channel(`user-subscription-changes-${internalUserId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_subscriptions_new', filter: `user_id=eq.${internalUserId}` },
          (payload) => {
            console.log('Subscription change received!', payload);
            queryClient.invalidateQueries({ queryKey: ['user-subscription', user.id] });
            queryClient.invalidateQueries({ queryKey: ['plan-access', user.id] });
          }
        )
        .subscribe((status, err) => {
          if (err) {
            console.error('Realtime subscription error:', err);
          }
        });

      paymentChannel = supabase.channel(`payment-history-changes-${internalUserId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'payments', filter: `user_id=eq.${internalUserId}` },
          (payload) => {
            console.log('Payment history change received!', payload);
            queryClient.invalidateQueries({ queryKey: ['payment-history', user.id] });
            queryClient.invalidateQueries({ queryKey: ['user-subscription', user.id] });
            queryClient.invalidateQueries({ queryKey: ['plan-access', user.id] });
          }
        )
        .subscribe((status, err) => {
          if (err) {
            console.error('Realtime payment history error:', err);
          }
        });
    };

    setupChannels();

    return () => {
      if (subscriptionChannel) supabase.removeChannel(subscriptionChannel);
      if (paymentChannel) supabase.removeChannel(paymentChannel);
    };
  }, [user, queryClient]);


  // Fetch plans from the subscription_plans table
  const { 
    data: plans = [], 
    isLoading: isLoadingPlans,
    error: plansError,
    refetch: refetchPlans
  } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("is_active", true)
          .order("price_monthly");

        if (error) throw error;
        
        // Use plan data directly from the database
        return (data || []).map(plan => {
          return {
            id: plan.plan_id,
            plan_id: plan.plan_id,
            name: plan.name,
            monthly_price: plan.price_monthly || 0,
            yearly_price: plan.price_yearly || 0,
            description: `${plan.name} plan - One-time payment`,
            features: {
              trading_accounts: plan.trading_account_limit || 0,
              strategies: plan.trading_strategy_limit || 0,
              unlimited_trades: true,
              csv_imports: true,
              broker_sync: true,
              data_storage: "unlimited",
              basic_analytics: plan.analytics_overview_access || false,
              advanced_analytics: plan.analytics_other_access || false,
              automatic_price_chart: true,
              trade_replay: true,
              ai_insights: false
            },
            validity_days: plan.validity_days || 30,
            notes_access: plan.notes_access || false,
            analytics_overview_access: plan.analytics_overview_access || false,
            analytics_other_access: plan.analytics_other_access || false,
            trading_account_limit: plan.trading_account_limit || 0,
            trading_strategy_limit: plan.trading_strategy_limit || 0,
            profile_access: plan.profile_access || true
          } as SubscriptionPlan;
        });
      } catch (error: any) {
        console.error("Error fetching plans:", error);
        toast({
          title: "Error",
          description: "Failed to load subscription plans",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: true,
    staleTime: 60 * 1000 * 5, // Plans don't change often
    refetchOnWindowFocus: false,
  });

  // Fetch user's current subscription
  const { 
    data: userSubscription, 
    isLoading: isLoadingSubscription,
    error: subscriptionError,
    refetch: refetchSubscription
  } = useQuery({
    queryKey: ["user-subscription", user?.id],
    queryFn: async () => {
      try {
        if (!user) return null;

        // The user.id from auth IS the user_id in app_users and other tables
        const userId = user.id;

        // Get subscription with plan details
        const { data: subData, error: subError } = await supabase
          .from("user_subscriptions_new")
          .select(`
            *,
            subscription_plans (
              plan_id,
              name,
              price_monthly,
              price_yearly,
              validity_days,
              notes_access,
              analytics_overview_access,
              analytics_other_access,
              trading_account_limit,
              trading_strategy_limit,
              profile_access
            )
          `)
          .eq("user_id", userId)
          .in("status", ["active", "expired"])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (subError) {
          console.error("Error fetching subscription:", subError);
          return null;
        }

        if (!subData) {
          console.log("No active subscription found");
          return null;
        }

        // Check if subscription is expired
        if (subData.end_date && new Date(subData.end_date) < new Date()) {
          console.log("Subscription is expired");
          // We still return the subscription data but with status set to expired
          subData.status = 'expired';
        }

        const planData = subData.subscription_plans;
        
        return {
          id: subData.subscription_id, // This is now string, matching the interface
          user_id: subData.user_id,
          plan_id: subData.plan_id,
          status: subData.status as 'active' | 'expired' | 'trialing',
          start_date: subData.start_date,
          end_date: subData.end_date,
          billing_cycle: subData.billing_cycle as 'monthly' | 'yearly',
          next_billing_date: subData.next_billing_date,
          plan: planData ? {
            id: planData.plan_id, // This is now string, matching the interface
            plan_id: planData.plan_id,
            name: planData.name,
            monthly_price: planData.price_monthly || 0,
            yearly_price: planData.price_yearly || 0,
            description: `${planData.name} subscription`,
            features: {
              trading_accounts: planData.trading_account_limit || 0,
              strategies: planData.trading_strategy_limit || 0,
              unlimited_trades: true,
              csv_imports: true,
              broker_sync: true,
              data_storage: "unlimited",
              basic_analytics: planData.analytics_overview_access || false,
              advanced_analytics: planData.analytics_other_access || false,
              automatic_price_chart: true,
              trade_replay: true,
              ai_insights: false
            },
            validity_days: planData.validity_days || 30,
            notes_access: planData.notes_access || false,
            analytics_overview_access: planData.analytics_overview_access || false,
            analytics_other_access: planData.analytics_other_access || false,
            trading_account_limit: planData.trading_account_limit || 0,
            trading_strategy_limit: planData.trading_strategy_limit || 0,
            profile_access: planData.profile_access || true
          } : undefined
        } as UserSubscription;
      } catch (error: any) {
        console.error("Error fetching user subscription:", error);
        return null;
      }
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Fetch payment history  
  const { 
    data: paymentHistory = [], 
    isLoading: isLoadingPayments,
    error: paymentsError,
    refetch: refetchPayments
  } = useQuery({
    queryKey: ["payment-history", user?.id],
    queryFn: async () => {
      try {
        if (!user) return [];

        // The user.id from auth IS the user_id in app_users and other tables
        const userId = user.id;

        const { data, error } = await supabase
          .from("payments")
          .select("*")
          .eq("user_id", userId)
          .order("payment_date", { ascending: false});

        if (error) throw error;
        
        return (data || []).map(payment => ({
          ...payment,
          status: payment.payment_status as 'succeeded' | 'failed' | 'pending' | 'refunded',
          billing_cycle: payment.billing_cycle as 'monthly' | 'yearly' | null,
        })) as PaymentHistory[];
      } catch (error: any) {
        console.error("Error fetching payment history:", error);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const calculateDaysLeftInTrial = (): number => {
    if (!user || !userSubscription || userSubscription.plan?.name !== 'Free Trial') {
      return 0;
    }
    
    // Use only end_date for all plans as requested
    const endDate = new Date(userSubscription.end_date);
    const now = new Date();
    
    if (endDate <= now) {
      return 0;
    }
    
    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const cancelSubscription = useMutation({
    mutationFn: async () => {
      try {
        if (!user || !userSubscription) throw new Error("No active subscription");
        
        setIsProcessing(true);
        
        // Update subscription status
        const { error } = await supabase
          .from("user_subscriptions_new")
          .update({ status: 'expired' })
          .eq("subscription_id", userSubscription.id);
        
        if (error) throw error;
        
        return { success: true };
      } catch (error: any) {
        console.error("Error cancelling subscription:", error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Access Cancelled",
        description: "Your plan access has been cancelled."
      });
      queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel your plan access",
        variant: "destructive",
      });
    },
  });

  const subscribe = useMutation({
    mutationFn: async (values: SubscriptionFormValues) => {
      try {
        if (!user) throw new Error("You must be logged in to purchase");
        
        setIsProcessing(true);
        
        console.log("Processing one-time payment:", values);
        window.location.href = `/checkout?plan=${values.planId}&cycle=${values.billingCycle}`;
        
        return { success: true };
      } catch (error: any) {
        console.error("Error processing payment:", error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to process your payment",
        variant: "destructive",
      });
    },
  });

  const processOneTimePayment = useMutation({
    mutationFn: async (values: {
      planId: string;
      billingCycle: string;
      customerName: string;
      customerEmail: string;
      paymentMethod: string;
    }) => {
      try {
        setIsProcessing(true);
        
        console.log("Processing one-time payment:", values);
        
        if (values.paymentMethod === "paypal") {
          window.location.href = `https://paypal.com/checkout?plan=${values.planId}`;
        } else if (values.paymentMethod === "phonepe") {
          window.location.href = `https://phonepe.com/pay?plan=${values.planId}`;
        } else {
          window.location.href = `/payment-confirm?plan=${values.planId}`;
        }
        
        return { success: true };
      } catch (error: any) {
        console.error("Error processing one-time payment:", error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to process your payment",
        variant: "destructive",
      });
    },
  });

  return {
    plans,
    userSubscription,
    paymentHistory,
    isLoadingPlans,
    isLoadingSubscription,
    isLoadingPayments,
    isProcessing,
    plansError,
    subscriptionError,
    paymentsError,
    refetchSubscription,
    refetchPlans,
    refetchPayments,
    calculateDaysLeftInTrial,
    cancelSubscription,
    subscribe,
    processOneTimePayment
  };
};
