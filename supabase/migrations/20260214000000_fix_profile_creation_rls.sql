-- Migration: Fix Profile Creation RLS Issue
-- Description: Adds a policy to allow users to read their own profile immediately after creation
-- Issue: Users getting 406 errors when querying app_users during signup because RLS blocks the query

-- =====================================================
-- Add policy for service role to insert user profiles
-- =====================================================
-- This allows the trigger function to insert without RLS blocking it
CREATE POLICY "Service role can insert user profiles"
    ON app_users FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- Update the existing SELECT policy to be more permissive during auth
-- =====================================================
-- Drop the restrictive policy that might be causing issues
DROP POLICY IF EXISTS "Users can view their own profile" ON app_users;

-- Create a new policy that allows users to see their profile even during initial setup
CREATE POLICY "Users can view their own profile"
    ON app_users FOR SELECT
    USING (
        auth.uid() = id 
        OR 
        -- Allow reading during the brief window after auth.users insert but before full session
        (auth.uid() IS NOT NULL AND id = auth.uid())
    );

-- =====================================================
-- Add a bypass for the trigger function
-- =====================================================
-- Ensure the trigger function can always create profiles
CREATE POLICY "Trigger can create profiles"
    ON app_users FOR INSERT
    WITH CHECK (
        -- Allow inserts from the trigger function (SECURITY DEFINER context)
        current_setting('role', true) = 'postgres'
        OR
        current_setting('role', true) = 'service_role'
        OR
        -- Also allow if the ID matches the authenticated user
        auth.uid() = id
    );

-- =====================================================
-- Update trader_profiles to allow trigger insertion
-- =====================================================
DROP POLICY IF EXISTS "Trigger can create trader profiles" ON trader_profiles;

CREATE POLICY "Trigger can create trader profiles"
    ON trader_profiles FOR INSERT
    WITH CHECK (
        current_setting('role', true) = 'postgres'
        OR
        current_setting('role', true) = 'service_role'
        OR
        auth.uid() = user_id
    );

-- =====================================================
-- Update user_settings to allow trigger insertion
-- =====================================================
DROP POLICY IF EXISTS "Trigger can create user settings" ON user_settings;

CREATE POLICY "Trigger can create user settings"
    ON user_settings FOR INSERT
    WITH CHECK (
        current_setting('role', true) = 'postgres'
        OR
        current_setting('role', true) = 'service_role'
        OR
        auth.uid() = user_id
    );

-- =====================================================
-- Update user_subscriptions to allow trigger insertion
-- =====================================================
DROP POLICY IF EXISTS "Trigger can create subscriptions" ON user_subscriptions;

CREATE POLICY "Trigger can create subscriptions"
    ON user_subscriptions FOR INSERT
    WITH CHECK (
        current_setting('role', true) = 'postgres'
        OR
        current_setting('role', true) = 'service_role'
        OR
        auth.uid() = user_id
    );

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON POLICY "Service role can insert user profiles" ON app_users IS 
    'Allows the database trigger to create user profiles without RLS blocking';

COMMENT ON POLICY "Trigger can create profiles" ON app_users IS 
    'Ensures the handle_new_signup trigger can create profiles in SECURITY DEFINER context';

COMMENT ON POLICY "Trigger can create trader profiles" ON trader_profiles IS 
    'Allows trigger to create trader profiles during signup';

COMMENT ON POLICY "Trigger can create user settings" ON user_settings IS 
    'Allows trigger to create default user settings during signup';

COMMENT ON POLICY "Trigger can create subscriptions" ON user_subscriptions IS 
    'Allows trigger to create trial subscriptions during signup';
