-- Migration: Missing Frontend RPCs
-- Description: Implements missing RPC/database functions required by the frontend
-- Dependencies: Phase 2 (payment_history), Phase 7 (notifications)

-- =====================================================
-- FUNCTION: get_admin_payments
-- Description: Fetches paginated payment history with user details for Admin Dashboard
-- =====================================================
CREATE OR REPLACE FUNCTION get_admin_payments()
RETURNS TABLE (
    payment_id UUID,
    user_id UUID,
    username TEXT,
    email TEXT,
    amount DECIMAL(10,2),
    currency TEXT,
    payment_status TEXT,
    payment_method TEXT,
    subscription_plan TEXT,
    billing_cycle TEXT,
    payment_date TIMESTAMPTZ,
    order_number TEXT,
    invoice_id TEXT,
    transaction_id TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ph.id AS payment_id,
        ph.user_id,
        au.username,
        au.email,
        ph.amount,
        ph.currency,
        ph.status AS payment_status,
        ph.payment_method,
        sp.name AS subscription_plan,
        us.billing_cycle,
        ph.created_at AS payment_date, -- Using created_at as payment_date
        ph.order_number,
        ph.invoice_id,
        ph.transaction_id,
        ph.admin_notes,
        ph.created_at
    FROM 
        payment_history ph
    LEFT JOIN 
        app_users au ON ph.user_id = au.id
    LEFT JOIN 
        user_subscriptions us ON ph.subscription_id = us.id
    LEFT JOIN 
        subscription_plans sp ON us.plan_id = sp.id
    ORDER BY 
        ph.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION get_admin_payments IS 'Fetches all payment records with joined user and plan details for admin dashboard';

-- =====================================================
-- FUNCTION: update_payment_status
-- Description: Updates the status of a payment record
-- =====================================================
CREATE OR REPLACE FUNCTION update_payment_status(
    payment_id_param UUID,
    status_param TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Validate status
    IF status_param NOT IN ('pending', 'succeeded', 'failed', 'refunded', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid payment status: %', status_param;
    END IF;

    UPDATE payment_history
    SET 
        status = status_param,
        updated_at = NOW() -- Assume trigger handles this, but setting explicitly if not
    WHERE 
        id = payment_id_param;
        
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment not found with ID: %', payment_id_param;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION update_payment_status IS 'Updates the status of a specific payment record (Admin only)';

-- =====================================================
-- FUNCTION: update_payment_admin_notes
-- Description: Updates admin notes for a payment record
-- =====================================================
CREATE OR REPLACE FUNCTION update_payment_admin_notes(
    payment_id_param UUID,
    notes_param TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE payment_history
    SET 
        admin_notes = notes_param
    WHERE 
        id = payment_id_param;
        
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment not found with ID: %', payment_id_param;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION update_payment_admin_notes IS 'Updates admin notes for a specific payment record (Admin only)';

-- =====================================================
-- FUNCTION: get_payment_metrics
-- Description: Calculates payment metrics for Admin Dashboard
-- =====================================================
CREATE OR REPLACE FUNCTION get_payment_metrics()
RETURNS TABLE (
    total_revenue DECIMAL(15,2),
    total_payments_count BIGINT,
    avg_payment_value DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(amount), 0) AS total_revenue,
        COUNT(*) AS total_payments_count,
        COALESCE(AVG(amount), 0) AS avg_payment_value
    FROM 
        payment_history
    WHERE 
        status = 'succeeded';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION get_payment_metrics IS 'Calculates aggregate payment metrics (revenue, count, average) for succeeded payments';

-- =====================================================
-- FUNCTION: create_notification (Overloaded/Updated)
-- Description: Creates a new notification, adapting frontend params to schema
-- =====================================================
-- Note: existing create_notification takes (p_user_id, p_type, p_title...)
-- Frontend calls with object: { target_user_id, notification_type, source_user_id, trade_id, title, message }
-- We need to create a wrapper or update the frontend. 
-- BETTER APPROACH: Create a wrapper function that matches the frontend signature exactly if possible, 
-- or ensure the frontend calls matches the existing function.
-- The frontend call is: rpc('create_notification', { target_user_id, ... })
-- This implies named parameters. We can create a function with these specific parameter names.

CREATE OR REPLACE FUNCTION create_notification(
    target_user_id UUID,
    notification_type TEXT,
    title TEXT,
    message TEXT,
    source_user_id UUID DEFAULT NULL,
    trade_id UUID DEFAULT NULL,
    action_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_data JSONB;
    v_notification_id UUID;
    v_priority TEXT := 'normal';
BEGIN
    -- Construct data JSON object
    v_data := '{}'::JSONB;
    
    IF source_user_id IS NOT NULL THEN
        v_data := jsonb_set(v_data, '{source_user_id}', to_jsonb(source_user_id));
    END IF;
    
    IF trade_id IS NOT NULL THEN
        v_data := jsonb_set(v_data, '{trade_id}', to_jsonb(trade_id));
    END IF;

    -- Insert using the underlying table structure
    -- Mapping notification_type to type
    INSERT INTO notifications (
        user_id, 
        type, 
        title, 
        message, 
        action_type, 
        action_url, 
        data, 
        priority
    ) VALUES (
        target_user_id, 
        notification_type, 
        title, 
        message, 
        CASE WHEN action_url IS NOT NULL THEN 'navigate' ELSE 'none' END,
        action_url, 
        v_data, 
        v_priority
    )
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION create_notification(UUID, TEXT, TEXT, TEXT, UUID, UUID, TEXT) IS 'Wrapper for creating notifications with frontend-specific parameter names';


-- =====================================================
-- FUNCTION: get_user_segments
-- Description: Returns user counts by segment for Notifiction Center
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_segments()
RETURNS JSONB AS $$
DECLARE
    v_all_users_count INT;
    v_new_signups_7d_count INT;
    v_new_signups_30d_count INT;
    v_free_trial_count INT;
    v_starter_plan_count INT;
    v_pro_plan_count INT;
    v_trial_period_count INT;
    v_result JSONB;
BEGIN
    -- All Users
    SELECT COUNT(*) INTO v_all_users_count FROM app_users;
    
    -- New Signups (7d)
    SELECT COUNT(*) INTO v_new_signups_7d_count 
    FROM app_users 
    WHERE created_at > NOW() - INTERVAL '7 days';
    
    -- New Signups (30d)
    SELECT COUNT(*) INTO v_new_signups_30d_count 
    FROM app_users 
    WHERE created_at > NOW() - INTERVAL '30 days';
    
    -- Free Trial Users (based on plan or status)
    SELECT COUNT(*) INTO v_free_trial_count 
    FROM app_users 
    WHERE subscription_status = 'trialing';
    
    -- Use user_subscriptions for accurate plan counts
    -- Starter Plan
    SELECT COUNT(DISTINCT us.user_id) INTO v_starter_plan_count
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE sp.name LIKE '%starter%' AND us.status = 'active';
    
    -- Pro Plan
    SELECT COUNT(DISTINCT us.user_id) INTO v_pro_plan_count
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE sp.name LIKE '%pro%' AND us.status = 'active';

    -- Trial Period Users (redundant to free_trial_count but asked for)
    v_trial_period_count := v_free_trial_count;

    -- Construct Result
    v_result := jsonb_build_object(
        'all_users', jsonb_build_object('count', v_all_users_count, 'description', 'All registered users'),
        'new_signups_7d', jsonb_build_object('count', v_new_signups_7d_count, 'description', 'Users joined in last 7 days'),
        'new_signups_30d', jsonb_build_object('count', v_new_signups_30d_count, 'description', 'Users joined in last 30 days'),
        'free_trial_users', jsonb_build_object('count', v_free_trial_count, 'description', 'Users currently in trial period'),
        'starter_plan_users', jsonb_build_object('count', v_starter_plan_count, 'description', 'Active Starter plan subscribers'),
        'pro_plan_users', jsonb_build_object('count', v_pro_plan_count, 'description', 'Active Pro plan subscribers'),
        'trial_period_users', jsonb_build_object('count', v_trial_period_count, 'description', 'Users in trial period')
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION get_user_segments IS 'Returns counts of users in various segments for targeted notifications';

-- =====================================================
-- Grant necessary permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION get_admin_payments() TO authenticated;
GRANT EXECUTE ON FUNCTION update_payment_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_payment_admin_notes(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_payment_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification(UUID, TEXT, TEXT, TEXT, UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_segments() TO authenticated;
