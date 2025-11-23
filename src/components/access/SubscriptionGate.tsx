import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { isSubscriptionActive, isTrialExpired } from '@/lib/access-control';
import { SubscriptionStatus } from '@/lib/types/subscription';

interface SubscriptionGateProps {
  children: React.ReactNode;
  requireActive?: boolean;
  redirectTo?: string;
}

export function SubscriptionGate({
  children,
  requireActive = true,
  redirectTo = '/pricing',
}: SubscriptionGateProps) {
  const { user, subscriptionPlan, trialActive, daysLeftInTrial } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireActive) {
    // Check if subscription is active or trial is still valid
    const hasActiveSubscription = subscriptionPlan !== 'No Active Plan' && subscriptionPlan !== null;
    const hasValidTrial = trialActive && daysLeftInTrial > 0;

    if (!hasActiveSubscription && !hasValidTrial) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  return <>{children}</>;
}
