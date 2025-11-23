-- Migration: Phase 1 - Core Authentication & Users
-- Description: Creates core user management tables with proper relationships to auth.users
-- Dependencies: Requires Supabase Auth to be enabled

-- =====================================================
-- TABLE: app_users
-- Description: Main application user profiles linked to auth.users
-- =====================================================
CREATE TABLE app_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
            THEN first_name || ' ' || last_name
            WHEN first_name IS NOT NULL THEN first_name
            WHEN last_name IS NOT NULL THEN last_name
            ELSE username
        END
    ) STORED,
    display_name TEXT, -- Separate field for custom display name
    avatar_url TEXT,
    user_role TEXT DEFAULT 'user' CHECK (user_role IN ('user', 'admin', 'moderator')),
    subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN ('trialing', 'active', 'expired', 'cancelled', 'past_due')),
    trial_end_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    onboarding_completed BOOLEAN DEFAULT false,
    profile_completed BOOLEAN DEFAULT false, -- Track if profile setup is complete
    email_verified BOOLEAN DEFAULT false, -- Track email verification status
    signup_source TEXT, -- Track signup source (web, mobile, referral, etc.)
    is_active BOOLEAN DEFAULT true,
    affiliate_code TEXT UNIQUE,
    referred_by TEXT,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for app_users
CREATE INDEX idx_app_users_email ON app_users(email);
CREATE INDEX idx_app_users_username ON app_users(username);
CREATE INDEX idx_app_users_subscription_status ON app_users(subscription_status);
CREATE INDEX idx_app_users_trial_end_date ON app_users(trial_end_date) WHERE subscription_status = 'trialing';
CREATE INDEX idx_app_users_affiliate_code ON app_users(affiliate_code) WHERE affiliate_code IS NOT NULL;
CREATE INDEX idx_app_users_referred_by ON app_users(referred_by) WHERE referred_by IS NOT NULL;

-- Comments
COMMENT ON TABLE app_users IS 'Main application user profiles with subscription and authentication data';
COMMENT ON COLUMN app_users.id IS 'References auth.users(id) with CASCADE DELETE';
COMMENT ON COLUMN app_users.display_name IS 'Custom display name (if different from full_name)';
COMMENT ON COLUMN app_users.subscription_status IS 'Current subscription status: trialing (7-day trial), active (paid), expired, cancelled, past_due';
COMMENT ON COLUMN app_users.trial_end_date IS 'End date of trial period, defaults to 7 days from signup';
COMMENT ON COLUMN app_users.profile_completed IS 'Whether user has completed profile setup (onboarding)';
COMMENT ON COLUMN app_users.email_verified IS 'Whether user has verified their email address';
COMMENT ON COLUMN app_users.signup_source IS 'Source of signup (web, mobile, referral, google, etc.)';
COMMENT ON COLUMN app_users.affiliate_code IS 'Unique code this user can share for referrals';
COMMENT ON COLUMN app_users.referred_by IS 'Affiliate code of the user who referred this user';

-- =====================================================
-- TABLE: trader_profiles
-- Description: Extended trader information and public profile data
-- =====================================================
CREATE TABLE trader_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    bio TEXT,
    about_content TEXT, -- Extended about/bio content
    trading_experience TEXT CHECK (trading_experience IN ('beginner', 'intermediate', 'advanced', 'professional')),
    risk_tolerance TEXT CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
    preferred_markets TEXT[],
    location TEXT,
    timezone TEXT DEFAULT 'UTC',
    website_url TEXT,
    social_links JSONB DEFAULT '{}',
    profile_data JSONB DEFAULT '{}', -- Additional flexible profile data
    stats_visibility JSONB DEFAULT '{"show_pnl": true, "show_win_rate": true, "show_trades": true}', -- Control what stats are visible
    privacy_settings JSONB DEFAULT '{"profile_visible": true, "trades_visible": false}', -- Privacy controls
    is_public BOOLEAN DEFAULT false,
    total_trades INT DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    total_pnl DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for trader_profiles
CREATE INDEX idx_trader_profiles_user_id ON trader_profiles(user_id);
CREATE INDEX idx_trader_profiles_is_public ON trader_profiles(is_public) WHERE is_public = true;
CREATE INDEX idx_trader_profiles_trading_experience ON trader_profiles(trading_experience);

-- Comments
COMMENT ON TABLE trader_profiles IS 'Extended trader information for public profiles and community features';
COMMENT ON COLUMN trader_profiles.is_public IS 'Whether this profile is visible to other users';
COMMENT ON COLUMN trader_profiles.total_trades IS 'Cached count of total trades, updated by triggers';
COMMENT ON COLUMN trader_profiles.win_rate IS 'Cached win rate percentage, updated by triggers';

-- =====================================================
-- TABLE: user_settings
-- Description: User preferences stored as key-value pairs
-- =====================================================
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_setting UNIQUE(user_id, key)
);

-- Indexes for user_settings
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_user_settings_key ON user_settings(key);

-- Comments
COMMENT ON TABLE user_settings IS 'User preferences and configuration stored as flexible key-value pairs';
COMMENT ON COLUMN user_settings.key IS 'Setting key (e.g., theme, currency, timezone, notifications)';
COMMENT ON COLUMN user_settings.value IS 'Setting value as JSONB for flexibility';

-- =====================================================
-- FUNCTION: Generate unique username from email
-- =====================================================
CREATE OR REPLACE FUNCTION generate_username_from_email(email_input TEXT)
RETURNS TEXT AS $$
DECLARE
    base_username TEXT;
    final_username TEXT;
    counter INT := 0;
BEGIN
    -- Extract username from email (part before @)
    base_username := LOWER(SPLIT_PART(email_input, '@', 1));
    
    -- Remove special characters, keep only alphanumeric and underscore
    base_username := REGEXP_REPLACE(base_username, '[^a-z0-9_]', '', 'g');
    
    -- Ensure minimum length of 3 characters
    IF LENGTH(base_username) < 3 THEN
        base_username := base_username || '123';
    END IF;
    
    -- Ensure maximum length of 20 characters
    IF LENGTH(base_username) > 20 THEN
        base_username := SUBSTRING(base_username, 1, 20);
    END IF;
    
    final_username := base_username;
    
    -- Check for uniqueness and append counter if needed
    WHILE EXISTS (SELECT 1 FROM app_users WHERE username = final_username) LOOP
        counter := counter + 1;
        final_username := SUBSTRING(base_username, 1, 20 - LENGTH(counter::TEXT)) || counter::TEXT;
    END LOOP;
    
    RETURN final_username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION generate_username_from_email IS 'Generates a unique username from email address, ensuring uniqueness and proper format';

-- =====================================================
-- FUNCTION: Generate unique affiliate code
-- =====================================================
CREATE OR REPLACE FUNCTION generate_affiliate_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude similar looking chars
    code_length INT := 8;
BEGIN
    LOOP
        code := '';
        FOR i IN 1..code_length LOOP
            code := code || SUBSTRING(chars, (RANDOM() * LENGTH(chars))::INT + 1, 1);
        END LOOP;
        
        -- Check if code is unique
        EXIT WHEN NOT EXISTS (SELECT 1 FROM app_users WHERE affiliate_code = code);
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION generate_affiliate_code IS 'Generates a unique 8-character affiliate code for user referrals';

-- =====================================================
-- Grant necessary permissions
-- =====================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE app_users TO authenticated;
GRANT ALL ON TABLE trader_profiles TO authenticated;
GRANT ALL ON TABLE user_settings TO authenticated;
