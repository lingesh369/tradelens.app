-- Migration: Additional Helper Functions
-- Description: Adds utility functions for user management, profile checks, and admin operations
-- Dependencies: All previous migrations

-- =====================================================
-- FUNCTION: Get Current User Internal ID
-- =====================================================
CREATE OR REPLACE FUNCTION get_current_user_internal_id()
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_current_user_internal_id IS 'Returns the current authenticated user ID';

-- =====================================================
-- FUNCTION: Get Current User Profile
-- =====================================================
CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    user_role TEXT,
    user_status TEXT,
    profile_completed BOOLEAN,
    email_verified BOOLEAN,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.email,
        au.username,
        au.first_name,
        au.last_name,
        au.user_role,
        au.user_status,
        au.profile_completed,
        au.email_verified,
        au.created_at
    FROM app_users au
    WHERE au.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_current_user_profile IS 'Returns current user profile information';

-- =====================================================
-- FUNCTION: Check if User is Admin
-- =====================================================
CREATE OR REPLACE FUNCTION check_admin_role()
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT user_role INTO v_role
    FROM app_users
    WHERE id = auth.uid();
    
    RETURN v_role = 'Admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_admin_role IS 'Returns true if current user is an admin';

-- =====================================================
-- FUNCTION: Check if User Setup is Complete
-- =====================================================
CREATE OR REPLACE FUNCTION is_user_setup_complete()
RETURNS BOOLEAN AS $$
DECLARE
    v_profile_completed BOOLEAN;
    v_has_account BOOLEAN;
BEGIN
    -- Check if profile is completed
    SELECT profile_completed INTO v_profile_completed
    FROM app_users
    WHERE id = auth.uid();
    
    -- Check if user has at least one account
    SELECT EXISTS(
        SELECT 1 FROM accounts 
        WHERE user_id = auth.uid() 
        AND is_active = true
    ) INTO v_has_account;
    
    RETURN COALESCE(v_profile_completed, false) AND v_has_account;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_user_setup_complete IS 'Checks if user has completed profile setup and created an account';

-- =====================================================
-- FUNCTION: Check User Setup Status (Detailed)
-- =====================================================
CREATE OR REPLACE FUNCTION check_user_setup_status()
RETURNS JSONB AS $$
DECLARE
    v_user RECORD;
    v_accounts_count INT;
    v_strategies_count INT;
    v_trades_count INT;
BEGIN
    -- Get user data
    SELECT 
        profile_completed,
        onboarding_completed,
        email_verified
    INTO v_user
    FROM app_users
    WHERE id = auth.uid();
    
    -- Count resources
    SELECT COUNT(*) INTO v_accounts_count
    FROM accounts WHERE user_id = auth.uid() AND is_active = true;
    
    SELECT COUNT(*) INTO v_strategies_count
    FROM strategies WHERE user_id = auth.uid() AND is_active = true;
    
    SELECT COUNT(*) INTO v_trades_count
    FROM trades WHERE user_id = auth.uid();
    
    RETURN jsonb_build_object(
        'profile_completed', COALESCE(v_user.profile_completed, false),
        'onboarding_completed', COALESCE(v_user.onboarding_completed, false),
        'email_verified', COALESCE(v_user.email_verified, false),
        'has_accounts', v_accounts_count > 0,
        'has_strategies', v_strategies_count > 0,
        'has_trades', v_trades_count > 0,
        'accounts_count', v_accounts_count,
        'strategies_count', v_strategies_count,
        'trades_count', v_trades_count,
        'setup_complete', COALESCE(v_user.profile_completed, false) AND v_accounts_count > 0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_user_setup_status IS 'Returns detailed user setup status including profile, accounts, and resources';

-- =====================================================
-- FUNCTION: Ensure User Profile Exists
-- =====================================================
CREATE OR REPLACE FUNCTION ensure_user_profile_exists(user_auth_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_exists BOOLEAN;
    v_profile_exists BOOLEAN;
    v_settings_exists BOOLEAN;
BEGIN
    -- Check if app_users record exists
    SELECT EXISTS(
        SELECT 1 FROM app_users WHERE id = user_auth_id
    ) INTO v_user_exists;
    
    -- Check if trader_profiles record exists
    SELECT EXISTS(
        SELECT 1 FROM trader_profiles WHERE user_id = user_auth_id
    ) INTO v_profile_exists;
    
    -- Check if user_settings exist
    SELECT EXISTS(
        SELECT 1 FROM user_settings WHERE user_id = user_auth_id
    ) INTO v_settings_exists;
    
    -- Create missing records
    IF NOT v_user_exists THEN
        -- This shouldn't happen, but handle it
        RETURN jsonb_build_object(
            'success', false,
            'message', 'User not found in app_users table'
        );
    END IF;
    
    IF NOT v_profile_exists THEN
        INSERT INTO trader_profiles (user_id)
        VALUES (user_auth_id);
    END IF;
    
    IF NOT v_settings_exists THEN
        INSERT INTO user_settings (user_id, key, value) VALUES
            (user_auth_id, 'theme', '"light"'),
            (user_auth_id, 'currency', '"USD"'),
            (user_auth_id, 'timezone', '"UTC"'),
            (user_auth_id, 'notifications', '{"email": true, "push": true, "in_app": true}');
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'user_exists', v_user_exists,
        'profile_exists', v_profile_exists,
        'settings_exists', v_settings_exists,
        'profile_created', NOT v_profile_exists,
        'settings_created', NOT v_settings_exists
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION ensure_user_profile_exists IS 'Ensures all required user profile records exist, creates if missing';

-- =====================================================
-- FUNCTION: Initialize Default User Accounts & Strategies
-- =====================================================
CREATE OR REPLACE FUNCTION initialize_default_user_accounts_strategies(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_account_id UUID;
    v_has_accounts BOOLEAN;
    v_has_strategies BOOLEAN;
BEGIN
    -- Check if user already has accounts
    SELECT EXISTS(
        SELECT 1 FROM accounts WHERE user_id = user_id_param
    ) INTO v_has_accounts;
    
    -- Check if user already has strategies
    SELECT EXISTS(
        SELECT 1 FROM strategies WHERE user_id = user_id_param
    ) INTO v_has_strategies;
    
    -- Create default account if none exists
    IF NOT v_has_accounts THEN
        INSERT INTO accounts (
            user_id, account_name, broker, account_type,
            currency, initial_balance, current_balance, is_active
        ) VALUES (
            user_id_param, 'Main Trading Account', 'Demo Broker', 'demo',
            'USD', 10000.00, 10000.00, true
        )
        RETURNING id INTO v_account_id;
    ELSE
        -- Get first account
        SELECT id INTO v_account_id
        FROM accounts
        WHERE user_id = user_id_param
        AND is_active = true
        LIMIT 1;
    END IF;
    
    -- Create default strategies if none exist
    IF NOT v_has_strategies AND v_account_id IS NOT NULL THEN
        INSERT INTO strategies (
            user_id, account_id, strategy_name, description, is_active
        ) VALUES
        (user_id_param, v_account_id, 'Trend Following', 'Follow the market trend', true),
        (user_id_param, v_account_id, 'Breakout Trading', 'Trade breakouts from key levels', true),
        (user_id_param, v_account_id, 'Scalping', 'Quick in and out trades', true);
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION initialize_default_user_accounts_strategies IS 'Creates default account and strategies for new users';

-- =====================================================
-- FUNCTION: Check Expired Subscriptions (Cron Job)
-- =====================================================
CREATE OR REPLACE FUNCTION check_expired_subscriptions()
RETURNS JSONB AS $$
DECLARE
    v_expired_count INT := 0;
    v_expiring_soon_count INT := 0;
BEGIN
    -- Update expired subscriptions
    UPDATE user_subscriptions
    SET status = 'expired'
    WHERE status IN ('active', 'trialing')
    AND current_period_end < NOW();
    
    GET DIAGNOSTICS v_expired_count = ROW_COUNT;
    
    -- Sync to app_users
    UPDATE app_users au
    SET subscription_status = 'expired'
    FROM user_subscriptions us
    WHERE au.id = us.user_id
    AND us.status = 'expired'
    AND au.subscription_status != 'expired';
    
    -- Count subscriptions expiring in next 3 days
    SELECT COUNT(*) INTO v_expiring_soon_count
    FROM user_subscriptions
    WHERE status IN ('active', 'trialing')
    AND current_period_end BETWEEN NOW() AND NOW() + INTERVAL '3 days';
    
    RETURN jsonb_build_object(
        'expired_count', v_expired_count,
        'expiring_soon_count', v_expiring_soon_count,
        'checked_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_expired_subscriptions IS 'Checks and updates expired subscriptions (for cron jobs)';

-- =====================================================
-- FUNCTION: Update Expired Subscriptions (Legacy)
-- =====================================================
CREATE OR REPLACE FUNCTION update_expired_subscriptions()
RETURNS void AS $$
BEGIN
    -- Just call the new function
    PERFORM check_expired_subscriptions();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_expired_subscriptions IS 'Legacy function - calls check_expired_subscriptions';

-- =====================================================
-- Grant Permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION get_current_user_internal_id TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION check_admin_role TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_setup_complete TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_setup_status TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_user_profile_exists TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_default_user_accounts_strategies TO authenticated;
GRANT EXECUTE ON FUNCTION check_expired_subscriptions TO authenticated;
GRANT EXECUTE ON FUNCTION update_expired_subscriptions TO authenticated;
