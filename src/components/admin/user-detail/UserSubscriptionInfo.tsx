
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { UserPlanManager } from '../UserPlanManager';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from '@/components/ui/button';

interface UserDetails {
  user_id: string;
  current_plan_id?: string;
  first_name: string | null;
  last_name: string | null;
}

interface UserStats {
  trial_days_remaining?: number;
}

interface UserSubscriptionInfoProps {
  userDetails: UserDetails;
  userStats: UserStats | null;
  formatDate: (dateString: string | null) => string;
  onUpdate?: () => void;
}

const UserSubscriptionInfo = ({ userDetails, userStats, formatDate, onUpdate }: UserSubscriptionInfoProps) => {
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    async function fetchPlanAndSubscriptionDetails() {
      try {
        // Fetch active subscription details
        const { data: subData, error: subError } = await supabase
          .from('user_subscriptions')
          .select(`
            *,
            subscription_plans (
              plan_id,
              name,
              validity_days
            )
          `)
          .eq('user_id', userDetails.user_id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (subError) {
          console.error('Error fetching subscription:', subError);
          return;
        }
        
        if (subData) {
          setSubscriptionDetails(subData);
          setPlanDetails(subData.subscription_plans);
        }
      } catch (error) {
        console.error('Error fetching subscription details:', error);
      }
    }
    
    fetchPlanAndSubscriptionDetails();
  }, [userDetails.user_id]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="mr-2 h-5 w-5" />
          Subscription Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium">Current Plan</p>
          <Badge 
            className="mt-1"
            variant={
              planDetails?.name === 'Pro'
                ? 'default'
                : planDetails?.name === 'Starter'
                  ? 'secondary'
                  : 'outline'
            }
          >
            {planDetails?.name || 'Unknown'}
          </Badge>
        </div>
        
        {subscriptionDetails && (
          <>
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-sm">
                {subscriptionDetails.status === 'active' ? 'Active' : 'Expired'}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium">Subscription Period</p>
              <p className="text-sm">
                {formatDate(subscriptionDetails.start_date)} → {formatDate(subscriptionDetails.end_date)}
              </p>
            </div>
          </>
        )}
        
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-4 border-t pt-4">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center justify-between w-full">
              <span>Manage Subscription</span>
              <ChevronDown className="h-4 w-4 transition-transform" 
                style={{ transform: isOpen ? 'rotate(180deg)' : undefined }} 
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <UserPlanManager 
              userId={userDetails.user_id}
              userName={`${userDetails.first_name || ''} ${userDetails.last_name || ''}`.trim() || undefined}
              currentPlanId={planDetails?.plan_id}
            />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default UserSubscriptionInfo;
