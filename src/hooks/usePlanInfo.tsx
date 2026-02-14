
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface PlanInfo {
  name: string;
  isExpired: boolean;
  daysLeft: number;
}

export const usePlanInfo = () => {
  const { user } = useAuth();
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);

  useEffect(() => {
    async function fetchPlanInfo() {
      if (user) {
        try {
          // The user.id from auth IS the user_id in app_users and other tables
          const userId = user.id;
          
          // Get subscription details (both active and expired)
          const { data: subData, error: subError } = await supabase
            .from('user_subscriptions')
            .select(`
              status,
              current_period_end,
              subscription_plans (name)
            `)
            .eq('user_id', userId)
            .in('status', ['active', 'trialing', 'expired'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
            
          if (subError) {
            console.error('Error fetching subscription:', subError);
            // Fallback for new users - give them a 7-day free trial
            setPlanInfo({ name: 'Free Trial', isExpired: false, daysLeft: 7 });
            return;
          }
          
          const planName = subData?.subscription_plans?.name || 'Free Trial';
          const now = new Date();
          let daysLeft = 0;
          let isExpired = false;
          
          // Check if subscription is expired based on status and current_period_end
          if (subData?.status === 'expired' || subData?.status === 'cancelled') {
            isExpired = true;
            daysLeft = 0;
          } else if (subData?.current_period_end) {
            const endDate = new Date(subData.current_period_end);
            daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            // Mark as expired if end date is in the past
            isExpired = endDate < now;
          } else {
            // If no current_period_end is set, treat as free trial for new users
            isExpired = false;
            daysLeft = 7;
          }
          
          setPlanInfo({
            name: planName,
            isExpired: isExpired,
            daysLeft: daysLeft
          });
        } catch (error) {
          console.error('Error fetching plan information:', error);
          // Fallback for new users - give them a 7-day free trial
          setPlanInfo({ name: 'Free Trial', isExpired: false, daysLeft: 7 });
        }
      }
    }
    
    fetchPlanInfo();
  }, [user]);

  return planInfo;
};
