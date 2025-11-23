
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSubscription } from '@/hooks/useSubscription';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { useAuth } from '@/context/AuthContext';
import { getDaysRemainingInTrial } from '@/lib/access-control';
import { Loader2, Crown, Calendar, CreditCard, Zap, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const SubscriptionInfo: React.FC = () => {
  const { data: subscription, isLoading } = useSubscription();
  const { features, planName } = useFeatureAccess();
  const { subscriptionPlan, trialActive, daysLeftInTrial } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading subscription details...</span>
      </div>
    );
  }

  const displayPlanName = subscription?.subscription_plans?.display_name || subscriptionPlan || 'Free Trial';
  const isTrial = trialActive || displayPlanName === 'Free Trial';
  const isPro = displayPlanName === 'Pro Plan';
  const isExpired = subscription?.status === 'expired' || subscription?.status === 'cancelled';
  const billingCycle = subscription?.billing_cycle || 'monthly';
  const currentPeriodEnd = subscription?.current_period_end;
  const trialDays = daysLeftInTrial;
  const trialProgress = isTrial ? ((7 - trialDays) / 7) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Trial Banner */}
      {isTrial && trialDays > 0 && (
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-500" />
                  Free Trial Active
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {trialDays} {trialDays === 1 ? 'day' : 'days'} remaining in your trial
                </p>
              </div>
              <Button onClick={() => navigate('/pricing')} size="sm">
                Upgrade Now
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Trial Progress</span>
                <span>{Math.round(trialProgress)}%</span>
              </div>
              <Progress value={trialProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expired Banner */}
      {isExpired && (
        <Card className="border-red-200 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg text-red-600 dark:text-red-400">
                  Subscription Expired
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Renew your subscription to continue accessing premium features
                </p>
              </div>
              <Button onClick={() => navigate('/pricing')} variant="destructive">
                Renew Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Subscription Card */}
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
            <Badge variant={isExpired ? "destructive" : isPro ? "default" : "secondary"}>
              {displayPlanName}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Plan Name</p>
              <p className="font-medium">{displayPlanName}</p>
            </div>
            {currentPeriodEnd && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {isTrial ? "Trial Ends" : "Next Billing Date"}
                </p>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(currentPeriodEnd), "PPP")}
                </p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant={isExpired ? "destructive" : "default"}>
                {isExpired ? "Expired" : "Active"}
              </Badge>
            </div>
            {!isTrial && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Billing Cycle</p>
                <p className="font-medium capitalize">{billingCycle}</p>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Plan Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                {features.aiAnalysis ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-gray-300" />
                )}
                <span className="text-sm">AI Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                {features.advancedAnalytics ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-gray-300" />
                )}
                <span className="text-sm">Advanced Analytics</span>
              </div>
              <div className="flex items-center gap-2">
                {features.communityFeatures ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-gray-300" />
                )}
                <span className="text-sm">Community Features</span>
              </div>
              <div className="flex items-center gap-2">
                {features.csvImport ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-gray-300" />
                )}
                <span className="text-sm">CSV Import</span>
              </div>
              <div className="flex items-center gap-2">
                {features.apiAccess ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-gray-300" />
                )}
                <span className="text-sm">API Access</span>
              </div>
              <div className="flex items-center gap-2">
                {features.prioritySupport ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-gray-300" />
                )}
                <span className="text-sm">Priority Support</span>
              </div>
            </div>
          </div>

          {/* Resource Limits */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Resource Limits</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Trades</p>
                <p className="font-medium text-lg">
                  {features.maxTrades === -1 ? "∞" : features.maxTrades}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Strategies</p>
                <p className="font-medium text-lg">
                  {features.maxStrategies === -1 ? "∞" : features.maxStrategies}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Accounts</p>
                <p className="font-medium text-lg">
                  {features.maxAccounts === -1 ? "∞" : features.maxAccounts}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Journal Entries</p>
                <p className="font-medium text-lg">
                  {features.maxJournalEntries === -1 ? "∞" : features.maxJournalEntries}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            {!isPro && !isExpired && (
              <Button onClick={() => navigate('/pricing')} className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Upgrade Plan
              </Button>
            )}
            {isExpired && (
              <Button onClick={() => navigate('/pricing')} variant="default" className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Renew Subscription
              </Button>
            )}
            {isPro && !isExpired && (
              <Button variant="outline" onClick={() => navigate('/pricing')} className="flex items-center gap-2">
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
