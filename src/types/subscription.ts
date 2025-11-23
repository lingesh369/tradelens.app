
export interface SubscriptionPlan {
  id: string; // Changed from number to string to match database UUID
  name: string;
  validity_days: number;
  notes_access: boolean;
  analytics_overview_access: boolean;
  analytics_other_access: boolean;
  trading_account_limit: number;
  trading_strategy_limit: number;
  profile_access: boolean;
  
  // Additional fields used in the app
  plan_id?: string | number;
  yearly_price?: number;
  monthly_price?: number;
  description?: string;
  features?: {
    trading_accounts: number;
    strategies: number;
    unlimited_trades: boolean;
    csv_imports: boolean;
    broker_sync: boolean;
    data_storage: string;
    basic_analytics: boolean;
    advanced_analytics: boolean;
    automatic_price_chart: boolean;
    trade_replay: boolean;
    ai_insights: boolean;
  };
}

export interface UserSubscription {
  id: string; // Changed from number to string to match database UUID
  user_id: string;
  plan_id: string; // Changed from number to string to match database UUID
  status: 'active' | 'expired' | 'trialing';
  start_date: string;
  end_date: string;
  plan?: SubscriptionPlan;
  
  // Additional fields
  billing_cycle?: 'monthly' | 'yearly';
  next_billing_date?: string;
  created_at?: string;
  updated_at?: string;
  subscription_id?: string;
}

export interface PaymentHistory {
  payment_id: string;
  user_id: string;
  subscription_plan?: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending' | 'refunded';
  payment_date: string;
  payment_method: string | null;
  description: string | null;
  created_at: string;
  payment_status?: string;
  subscription_id?: string;
  transaction_id?: string;
  invoice_id?: string;
  plan_id?: string;
  billing_cycle?: 'monthly' | 'yearly' | null;
  order_number?: string | null;
}

export interface SubscriptionFormValues {
  planId: string;
  billingCycle: 'monthly' | 'yearly';
}

export interface JournalImageUploadProps {
  onImagesChange?: (images: string[]) => void;
  initialImages?: string[];
  journalId?: string;
  onImageUploaded?: (imageData: any) => void;
}

export interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: any;
}

// Adding a new interface for the access restriction component
export interface AccessRestrictionProps {
  featureName: string;
  planRequired: string;
  onUpgrade?: () => void;
  onCancel?: () => void;
}
