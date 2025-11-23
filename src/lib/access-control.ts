// Access control and feature gating logic

import { SubscriptionStatus, SubscriptionFeatures, SubscriptionPlan } from './types/subscription';

// Feature limits by subscription plan
export const FEATURE_LIMITS: Record<string, SubscriptionFeatures> = {
  'Free Trial': {
    maxTrades: 50,
    maxStrategies: 3,
    maxAccounts: 2,
    maxJournalEntries: 20,
    aiAnalysis: true,
    advancedAnalytics: false,
    communityFeatures: true,
    csvImport: true,
    apiAccess: false,
    prioritySupport: false,
    customReports: false,
  },
  'Starter Plan': {
    maxTrades: 500,
    maxStrategies: 10,
    maxAccounts: 5,
    maxJournalEntries: 100,
    aiAnalysis: true,
    advancedAnalytics: true,
    communityFeatures: true,
    csvImport: true,
    apiAccess: false,
    prioritySupport: false,
    customReports: false,
  },
  'Pro Plan': {
    maxTrades: -1, // unlimited
    maxStrategies: -1,
    maxAccounts: -1,
    maxJournalEntries: -1,
    aiAnalysis: true,
    advancedAnalytics: true,
    communityFeatures: true,
    csvImport: true,
    apiAccess: true,
    prioritySupport: true,
    customReports: true,
  },
};

// Get feature limits for a plan
export function getFeatureLimits(planName: string): SubscriptionFeatures {
  return FEATURE_LIMITS[planName] || FEATURE_LIMITS['Free Trial'];
}

// Check if user has access to a feature
export function hasFeatureAccess(
  planName: string,
  feature: keyof SubscriptionFeatures
): boolean {
  const limits = getFeatureLimits(planName);
  return limits[feature] === true || limits[feature] === -1;
}

// Check if user is within usage limits
export function isWithinLimit(
  planName: string,
  limitType: 'maxTrades' | 'maxStrategies' | 'maxAccounts' | 'maxJournalEntries',
  currentCount: number
): boolean {
  const limits = getFeatureLimits(planName);
  const limit = limits[limitType];
  
  // -1 means unlimited
  if (limit === -1) return true;
  
  return currentCount < limit;
}

// Get remaining count for a limit
export function getRemainingCount(
  planName: string,
  limitType: 'maxTrades' | 'maxStrategies' | 'maxAccounts' | 'maxJournalEntries',
  currentCount: number
): number {
  const limits = getFeatureLimits(planName);
  const limit = limits[limitType];
  
  // -1 means unlimited
  if (limit === -1) return Infinity;
  
  return Math.max(0, limit - currentCount);
}

// Check if subscription is active
export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.TRIALING;
}

// Check if trial is expired
export function isTrialExpired(trialEndDate?: string): boolean {
  if (!trialEndDate) return false;
  return new Date(trialEndDate) < new Date();
}

// Calculate days remaining in trial
export function getDaysRemainingInTrial(trialEndDate?: string): number {
  if (!trialEndDate) return 0;
  
  const now = new Date();
  const end = new Date(trialEndDate);
  const diff = end.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  return Math.max(0, days);
}

// Get upgrade message for a feature
export function getUpgradeMessage(feature: string, requiredPlan: string): string {
  return `This feature requires ${requiredPlan}. Upgrade now to unlock it!`;
}

// Check if user needs to upgrade
export function needsUpgrade(
  currentPlan: string,
  requiredPlan: 'Starter Plan' | 'Pro Plan'
): boolean {
  const planHierarchy = {
    'Free Trial': 0,
    'Starter Plan': 1,
    'Pro Plan': 2,
  };
  
  const currentLevel = planHierarchy[currentPlan as keyof typeof planHierarchy] || 0;
  const requiredLevel = planHierarchy[requiredPlan];
  
  return currentLevel < requiredLevel;
}
