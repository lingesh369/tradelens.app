-- Migration: Fix trader_profiles RLS policies
-- Description: Add INSERT policy and fix UPDATE policy to work with app_users.id
-- Date: 2026-02-08

-- Drop existing policies
DROP POLICY IF EXISTS "Users can update their own trader profile" ON trader_profiles;
DROP POLICY IF EXISTS "Users can view their own trader profile" ON trader_profiles;

-- Recreate SELECT policy (no change needed, but recreating for consistency)
CREATE POLICY "Users can view their own trader profile"
    ON trader_profiles FOR SELECT
    USING (user_id = auth.uid());

-- Recreate UPDATE policy (same as before, should work)
CREATE POLICY "Users can update their own trader profile"
    ON trader_profiles FOR UPDATE
    USING (user_id = auth.uid());

-- Add INSERT policy for upsert operations
CREATE POLICY "Users can insert their own trader profile"
    ON trader_profiles FOR INSERT
    WITH CHECK (user_id = auth.uid());

COMMENT ON POLICY "Users can insert their own trader profile" ON trader_profiles IS 
'Allows users to create their trader profile (needed for upsert operations)';
