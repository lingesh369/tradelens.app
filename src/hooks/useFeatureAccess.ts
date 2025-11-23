import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from './useSubscription';
import {
  hasFeatureAccess,
  isWithinLimit,
  getRemainingCount,
  getFeatureLimits,
  needsUpgrade,
} from '@/lib/access-control';
import { SubscriptionFeatures } from '@/lib/types/subscription';

export function useFeatureAccess() {
  const { subscriptionPlan } = useAuth();
  const { data: subscription } = useSubscription();

  const planName = subscription?.subscription_plans?.display_name || subscriptionPlan || 'Free Trial';

  const features = useMemo(() => {
    return getFeatureLimits(planName);
  }, [planName]);

  const checkFeature = (feature: keyof SubscriptionFeatures): boolean => {
    return hasFeatureAccess(planName, feature);
  };

  const checkLimit = (
    limitType: 'maxTrades' | 'maxStrategies' | 'maxAccounts' | 'maxJournalEntries',
    currentCount: number
  ): boolean => {
    return isWithinLimit(planName, limitType, currentCount);
  };

  const getRemaining = (
    limitType: 'maxTrades' | 'maxStrategies' | 'maxAccounts' | 'maxJournalEntries',
    currentCount: number
  ): number => {
    return getRemainingCount(planName, limitType, currentCount);
  };

  const requiresUpgrade = (requiredPlan: 'Starter Plan' | 'Pro Plan'): boolean => {
    return needsUpgrade(planName, requiredPlan);
  };

  return {
    planName,
    features,
    checkFeature,
    checkLimit,
    getRemaining,
    requiresUpgrade,
  };
}
