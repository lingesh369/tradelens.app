// Subscription types matching database schema

export enum SubscriptionStatus {
  TRIALING = 'trialing',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
}

export enum SubscriptionPlan {
  FREE_TRIAL = 'Free Trial',
  STARTER = 'Starter Plan',
  PRO = 'Pro Plan',
}

export interface SubscriptionFeatures {
  maxTrades: number;
  maxStrategies: number;
  maxAccounts: number;
  maxJournalEntries: number;
  aiAnalysis: boolean;
  advancedAnalytics: boolean;
  communityFeatures: boolean;
  csvImport: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  customReports: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  billing_cycle: 'monthly' | 'yearly';
  payment_provider?: string;
  subscription_plans?: {
    name: string;
    display_name: string;
    features: SubscriptionFeatures;
  };
}
