
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { useSubscription } from '@/hooks/useSubscription';
import { Loader2, Crown, Calendar, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const SubscriptionInfo: React.FC = () => {
  const { access, isLoading: accessLoading } = usePlanAccess();
  const { userSubscription, isLoadingSubscription } = useSubscription();
  const navigate = useNavigate();

  const formatPlanName = (planName: string, billingCycle?: string) => {
    if (!planName) return 'Unknown Plan';
    
    // Special handling for Free Trial
    if (planName === 'Free Trial') {
      return '7-Day Free Trial';
    }
    
    // Special handling for Expired plans
    if (planName === 'Expired') {
      return 'Expired Plan';
    }
    
    // Special handling for Error state
    if (planName === 'Error') {
      return 'Free Trial'; // Default to Free Trial when there's an error
    }
    
    // If already formatted, return as is
    if (planName.includes('Monthly') || planName.includes('Yearly')) {
      return planName;
    }
    
    // Format the plan name
    const cycle = billingCycle === 'yearly' ? 'Yearly' : 'Monthly';
    return `${planName} ${cycle} Plan`;
  };

  const getBillingCycle = (planName: string, billingCycle?: string) => {
    // Special handling for Free Trial
    if (planName === 'Free Trial') {
      return 'weekly';
    }
    return billingCycle || 'monthly';
  };

  const handleUpgrade = () => {
    navigate('/subscription');
  };

  const handleManageBilling = () => {
    // This would typically open a customer portal
    navigate('/subscription');
  };

  if (accessLoading || isLoadingSubscription) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading subscription details...</span>
      </div>
    );
  }

  const planName = access?.planName || 'Free Trial';
  const formattedPlanName = formatPlanName(planName, userSubscription?.billing_cycle);
  const displayBillingCycle = getBillingCycle(planName, userSubscription?.billing_cycle);
  // Check if subscription is expired based on access data or subscription data
  const isExpired = access?.accessBlocked || !access?.isActive || userSubscription?.status === 'expired' || 
                   (userSubscription?.end_date && new Date(userSubscription.end_date) < new Date());
  const isTrial = planName === 'Free Trial';
  const isPro = planName === 'Pro';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Current Plan
              </CardTitle>
              <CardDescription>Your subscription details and features</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isExpired ? "destructive" : isPro ? "default" : "secondary"}>
                {isExpired ? "Expired Plan" : formattedPlanName}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Plan Name</p>
              <p className="font-medium">{formattedPlanName}</p>
            </div>
            {userSubscription?.end_date && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {isTrial ? "Trial Ends" : "Renewal Date"}
                </p>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(userSubscription.end_date), "PPP")}
                </p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="font-medium">
                {isExpired || userSubscription?.status === 'expired' || (userSubscription?.end_date && new Date(userSubscription.end_date) < new Date()) ? "Expired" : "Active"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Billing Cycle</p>
              <p className="font-medium capitalize">{displayBillingCycle}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Plan Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${access?.notes ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-sm">Notes & Journal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm">Analytics Dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${access?.gennie ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-sm">AI Assistant</span>
              </div>
              {isPro && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm">AI-Powered Insights</span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Resource Limits</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Trading Accounts</p>
                <p className="font-medium">
                  {access?.accountsLimit === -1 ? "Unlimited" : access?.accountsLimit || 0}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Strategies</p>
                <p className="font-medium">
                  {access?.strategiesLimit === -1 ? "Unlimited" : access?.strategiesLimit || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            {!isPro && (
              <Button onClick={handleUpgrade} className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Upgrade Plan
              </Button>
            )}
            {isPro && (
              <Button variant="outline" onClick={handleManageBilling} className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Manage Billing
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionInfo;
