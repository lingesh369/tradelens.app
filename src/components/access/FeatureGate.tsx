import React from 'react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { SubscriptionFeatures } from '@/lib/types/subscription';
import { UpgradePrompt } from './UpgradePrompt';

interface FeatureGateProps {
  feature: keyof SubscriptionFeatures;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  requiredPlan?: 'Starter Plan' | 'Pro Plan';
}

export function FeatureGate({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
  requiredPlan = 'Pro Plan',
}: FeatureGateProps) {
  const { checkFeature, requiresUpgrade } = useFeatureAccess();

  const hasAccess = checkFeature(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (showUpgradePrompt && requiresUpgrade(requiredPlan)) {
    return <UpgradePrompt feature={String(feature)} requiredPlan={requiredPlan} />;
  }

  return <>{fallback || null}</>;
}
