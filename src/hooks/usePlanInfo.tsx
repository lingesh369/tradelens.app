
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
          // Get user's subscription info
          const { data: userData, error: userError } = await supabase
            .from('app_users')
            .select('user_id')
            .eq('auth_id', user.id)
            .single();
            
          if (userError || !userData?.user_id) {
            // Fallback for new users - give them a 7-day free trial
            setPlanInfo({ name: 'Free Trial', isExpired: false, daysLeft: 7 });
            return;
          }
          
          // Get subscription details (both active and expired)
          const { data: subData, error: subError } = await supabase
            .from('user_subscriptions_new')
            .select(`
              status,
              end_date,
              subscription_plans (name)
            `)
            .eq('user_id', userData.user_id)
            .in('status', ['active', 'expired'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          if (subError) {
            // Fallback for new users - give them a 7-day free trial
            setPlanInfo({ name: 'Free Trial', isExpired: false, daysLeft: 7 });
            return;
          }
          
          const planName = subData?.subscription_plans?.name || 'Unknown';
          const now = new Date();
          let daysLeft = 0;
          let isExpired = false;
          
          // Check if subscription is expired based on status and end_date
          if (subData?.status === 'expired') {
            isExpired = true;
            daysLeft = 0;
          } else if (subData?.end_date) {
            const endDate = new Date(subData.end_date);
            daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            // Mark as expired if end date is in the past
            isExpired = endDate < now;
          } else {
            // If no end_date is set, treat as free trial for new users
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
