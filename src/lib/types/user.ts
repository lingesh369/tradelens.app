// User types matching database schema

export interface AppUser {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  display_name?: string;
  avatar_url?: string;
  user_role: 'user' | 'admin' | 'moderator';
  subscription_status: 'trialing' | 'active' | 'expired' | 'cancelled' | 'past_due';
  trial_end_date?: string;
  onboarding_completed: boolean;
  profile_completed: boolean;
  email_verified: boolean;
  signup_source?: string;
  is_active: boolean;
  affiliate_code?: string;
  referred_by?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TraderProfile {
  id: string;
  user_id: string;
  bio?: string;
  about_content?: string;
  trading_experience?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  risk_tolerance?: 'conservative' | 'moderate' | 'aggressive';
  preferred_markets?: string[];
  location?: string;
  timezone: string;
  website_url?: string;
  social_links?: Record<string, string>;
  profile_data?: Record<string, any>;
  stats_visibility?: {
    show_pnl: boolean;
    show_win_rate: boolean;
    show_trades: boolean;
  };
  privacy_settings?: {
    profile_visible: boolean;
    trades_visible: boolean;
  };
  is_public: boolean;
  total_trades: number;
  win_rate: number;
  total_pnl: number;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends AppUser {
  trader_profile?: TraderProfile;
}
