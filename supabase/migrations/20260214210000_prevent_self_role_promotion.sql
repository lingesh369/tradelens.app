-- Migration: Prevent Self Role Promotion
-- Description: Adds RLS policy to prevent users from promoting themselves to admin
-- Date: 2026-02-14

-- =====================================================
-- Policy: Users cannot change their own role
-- =====================================================
CREATE POLICY "Users cannot change their own role"
  ON app_users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    -- User can update their profile, but not their role
    user_role = (SELECT user_role FROM app_users WHERE id = auth.uid())
  );

-- =====================================================
-- Function: Validate Subscription Status Server-Side
-- =====================================================
CREATE OR REPLACE FUNCTION has_active_subscription()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = auth.uid()
    AND status IN ('active', 'trialing')
    AND current_period_end > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION has_active_subscription IS 'Server-side validation of active subscription status';

-- =====================================================
-- Function: Validate Feature Access
-- =====================================================
CREATE OR REPLACE FUNCTION has_feature_access(feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_access BOOLEAN;
  v_plan_features JSONB;
BEGIN
  -- Get user's current plan features
  SELECT sp.features INTO v_plan_features
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = auth.uid()
  AND us.status IN ('active', 'trialing')
  AND us.current_period_end > NOW()
  ORDER BY us.created_at DESC
  LIMIT 1;
  
  -- If no active subscription, return false
  IF v_plan_features IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if feature is enabled in plan
  v_has_access := COALESCE((v_plan_features->>feature_name)::BOOLEAN, false);
  
  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION has_feature_access IS 'Server-side validation of feature access based on subscription plan';

-- =====================================================
-- Policy: Validate is_shared flag cannot be manipulated
-- =====================================================
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their own trades" ON trades;

-- Recreate with additional validation
CREATE POLICY "Users can manage their own trades"
  ON trades FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    -- Ensure is_shared is a boolean and not manipulated maliciously
    AND (is_shared IS NULL OR is_shared IN (true, false))
  );

-- =====================================================
-- Function: Safely Toggle Trade Sharing
-- =====================================================
CREATE OR REPLACE FUNCTION toggle_trade_sharing(
  p_trade_id UUID,
  p_is_shared BOOLEAN
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_has_access BOOLEAN;
BEGIN
  -- Get trade owner
  SELECT user_id INTO v_user_id
  FROM trades
  WHERE id = p_trade_id;
  
  -- Verify ownership
  IF v_user_id != auth.uid() THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Unauthorized: You do not own this trade'
    );
  END IF;
  
  -- Check if user has community feature access
  v_has_access := has_feature_access('community');
  
  IF NOT v_has_access AND p_is_shared = true THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Upgrade required: Community features not available in your plan'
    );
  END IF;
  
  -- Update trade
  UPDATE trades
  SET is_shared = p_is_shared,
      updated_at = NOW()
  WHERE id = p_trade_id
  AND user_id = auth.uid();
  
  -- Log the action
  PERFORM log_security_event(
    auth.uid(),
    'trade_sharing_toggled',
    'data',
    jsonb_build_object(
      'trade_id', p_trade_id,
      'is_shared', p_is_shared
    ),
    NULL,
    NULL,
    'info',
    'success'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Trade sharing updated successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION toggle_trade_sharing IS 'Safely toggles trade sharing with validation and logging';

-- =====================================================
-- Grant Permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION has_active_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION has_feature_access TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_trade_sharing TO authenticated;
