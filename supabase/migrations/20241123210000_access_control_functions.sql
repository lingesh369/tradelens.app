-- Migration: Access Control Functions
-- Description: Creates comprehensive access control and user management functions
-- Dependencies: Phase 1-11 migrations

-- =====================================================
-- FUNCTION: Get User Access Matrix (Comprehensive)
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_access_matrix(auth_user_id UUID)
RETURNS TABLE (
    -- User Info
    userId UUID,
    email TEXT,
    username TEXT,
    userRole TEXT,
    userStatus TEXT,
    
    -- Subscription Info
    plan_id UUID,
    plan_name TEXT,
    plan_type TEXT,
    status TEXT,
    isActive BOOLEAN,
    accessBlocked BOOLEAN,
    
    -- Dates
    startDate TIMESTAMPTZ,
    endDate TIMESTAMPTZ,
    trialEndDate TIMESTAMPTZ,
    nextBillingDate TIMESTAMPTZ,
    
    -- Feature Access
    notesAccess BOOLEAN,
    profileAccess BOOLEAN,
    analyticsAccess BOOLEAN,
    communityAccess BOOLEAN,
    aiAccess BOOLEAN,
    
    -- Resource Limits
    accountsLimit INT,
    strategiesLimit INT,
    tradesLimit INT,
    
    -- Usage Tracking
    accountsUsed INT,
    strategiesUsed INT,
    tradesUsed INT
) AS $$
DECLARE
    v_user_record RECORD;
    v_subscription_record RECORD;
    v_plan_record RECORD;
BEGIN
    -- Get user data
    SELECT 
        au.id,
        au.email,
        au.username,
        au.user_role,
        au.is_active,
        au.subscription_status,
        au.trial_end_date
    INTO v_user_record
    FROM app_users au
    WHERE au.id = auth_user_id;
    
    -- If user not found, return empty
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Get active subscription
    SELECT 
        us.id,
        us.plan_id,
        us.status,
        us.current_period_start,
        us.current_period_end,
        us.next_billing_date
    INTO v_subscription_record
    FROM user_subscriptions us
    WHERE us.user_id = auth_user_id
    AND us.status IN ('active', 'trialing', 'past_due')
    ORDER BY us.created_at DESC
    LIMIT 1;
    
    -- Get plan details
    IF v_subscription_record.plan_id IS NOT NULL THEN
        SELECT 
            sp.id,
            sp.name,
            sp.plan_type,
            sp.features,
            sp.limits
        INTO v_plan_record
        FROM subscription_plans sp
        WHERE sp.id = v_subscription_record.plan_id;
    ELSE
        -- Get default/free plan
        SELECT 
            sp.id,
            sp.name,
            sp.plan_type,
            sp.features,
            sp.limits
        INTO v_plan_record
        FROM subscription_plans sp
        WHERE sp.is_default = true
        LIMIT 1;
    END IF;
    
    -- Return comprehensive access matrix
    RETURN QUERY
    SELECT
        -- User Info
        v_user_record.id,
        v_user_record.email,
        v_user_record.username,
        v_user_record.user_role,
        CASE WHEN v_user_record.is_active THEN 'active' ELSE 'inactive' END,
        
        -- Subscription Info
        v_plan_record.id,
        v_plan_record.name,
        v_plan_record.plan_type,
        COALESCE(v_subscription_record.status, 'trialing'),
        -- isActive: Check subscription status AND that it hasn't expired
        COALESCE(
            (v_subscription_record.status = 'active' AND v_subscription_record.current_period_end > NOW())
            OR (v_subscription_record.status = 'trialing' AND v_user_record.trial_end_date > NOW())
            AND v_user_record.is_active = true,
            false
        ),
        v_user_record.is_active = false,
        
        -- Dates
        v_subscription_record.current_period_start,
        v_subscription_record.current_period_end,
        v_user_record.trial_end_date,
        v_subscription_record.next_billing_date,
        
        -- Feature Access (from plan features JSONB)
        COALESCE((v_plan_record.features->>'notes')::BOOLEAN, false),
        COALESCE((v_plan_record.features->>'profile')::BOOLEAN, false),
        COALESCE((v_plan_record.features->>'analytics')::BOOLEAN, false),
        COALESCE((v_plan_record.features->>'community')::BOOLEAN, false),
        COALESCE((v_plan_record.features->>'ai')::BOOLEAN, false),
        
        -- Resource Limits (from plan limits JSONB)
        COALESCE((v_plan_record.limits->>'accounts')::INT, 1),
        COALESCE((v_plan_record.limits->>'strategies')::INT, 3),
        COALESCE((v_plan_record.limits->>'trades')::INT, -1),
        
        -- Current Usage
        (SELECT COUNT(*)::INT FROM accounts WHERE user_id = auth_user_id AND is_active = true),
        (SELECT COUNT(*)::INT FROM strategies WHERE user_id = auth_user_id AND is_active = true),
        (SELECT COUNT(*)::INT FROM trades WHERE user_id = auth_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_access_matrix IS 'Returns comprehensive user access control matrix including subscription, features, limits, and usage';

-- =====================================================
-- FUNCTION: Update User Role (Admin Only)
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_role(
    target_user_id UUID,
    new_role TEXT,
    reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_current_user_id UUID;
    v_current_role TEXT;
    v_old_role TEXT;
    v_ip_address TEXT;
BEGIN
    -- Get current user
    v_current_user_id := auth.uid();
    
    -- Check if current user is admin
    SELECT user_role INTO v_current_role
    FROM app_users
    WHERE id = v_current_user_id;
    
    IF v_current_role != 'Admin' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Unauthorized: Only admins can change user roles'
        );
    END IF;
    
    -- Validate new role
    IF new_role NOT IN ('User', 'Admin', 'Manager') THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Invalid role: Must be User, Admin, or Manager'
        );
    END IF;
    
    -- Get old role
    SELECT user_role INTO v_old_role
    FROM app_users
    WHERE id = target_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'User not found'
        );
    END IF;
    
    -- Update role
    UPDATE app_users
    SET user_role = new_role
    WHERE id = target_user_id;
    
    -- Log the change
    INSERT INTO user_role_audit (
        user_id,
        old_role,
        new_role,
        changed_by,
        reason,
        ip_address
    ) VALUES (
        target_user_id,
        v_old_role,
        new_role,
        v_current_user_id,
        reason,
        v_ip_address
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Role updated successfully',
        'old_role', v_old_role,
        'new_role', new_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_user_role IS 'Securely updates user role with audit logging (Admin only)';

-- =====================================================
-- FUNCTION: Assign User Plan (Admin Only)
-- =====================================================
CREATE OR REPLACE FUNCTION assign_user_plan(
    target_user_id UUID,
    plan_name_param TEXT,
    billing_cycle_param TEXT DEFAULT 'monthly',
    start_date_param TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
    v_current_user_id UUID;
    v_current_role TEXT;
    v_plan_id UUID;
    v_plan_duration INTERVAL;
    v_end_date TIMESTAMPTZ;
BEGIN
    -- Get current user
    v_current_user_id := auth.uid();
    
    -- Check if current user is admin
    SELECT user_role INTO v_current_role
    FROM app_users
    WHERE id = v_current_user_id;
    
    IF v_current_role != 'Admin' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Unauthorized: Only admins can assign plans'
        );
    END IF;
    
    -- Get plan ID
    SELECT id INTO v_plan_id
    FROM subscription_plans
    WHERE name = plan_name_param
    AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Plan not found or inactive'
        );
    END IF;
    
    -- Calculate end date based on billing cycle
    IF billing_cycle_param = 'monthly' THEN
        v_end_date := start_date_param + INTERVAL '1 month';
    ELSIF billing_cycle_param = 'yearly' THEN
        v_end_date := start_date_param + INTERVAL '1 year';
    ELSIF billing_cycle_param = 'lifetime' THEN
        v_end_date := start_date_param + INTERVAL '100 years';
    ELSE
        v_end_date := start_date_param + INTERVAL '1 month';
    END IF;
    
    -- Cancel existing active subscriptions
    UPDATE user_subscriptions
    SET status = 'cancelled',
        cancelled_at = NOW()
    WHERE user_id = target_user_id
    AND status IN ('active', 'trialing');
    
    -- Create new subscription
    INSERT INTO user_subscriptions (
        user_id,
        plan_id,
        status,
        billing_cycle,
        current_period_start,
        current_period_end,
        next_billing_date,
        payment_gateway
    ) VALUES (
        target_user_id,
        v_plan_id,
        'active',
        billing_cycle_param,
        start_date_param,
        v_end_date,
        v_end_date,
        'admin_assigned'
    );
    
    -- Update app_users subscription status
    UPDATE app_users
    SET subscription_status = 'active'
    WHERE id = target_user_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Plan assigned successfully',
        'plan_id', v_plan_id,
        'start_date', start_date_param,
        'end_date', v_end_date
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION assign_user_plan IS 'Assigns a subscription plan to a user (Admin only)';

-- =====================================================
-- FUNCTION: Invalidate User Access Cache
-- =====================================================
CREATE OR REPLACE FUNCTION invalidate_user_access_cache(target_user_id UUID)
RETURNS void AS $$
BEGIN
    -- This is a placeholder for cache invalidation
    -- In production, this would trigger cache clearing in Redis/Memcached
    -- For now, we just update the updated_at timestamp to signal changes
    UPDATE app_users
    SET updated_at = NOW()
    WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION invalidate_user_access_cache IS 'Invalidates cached user access data (placeholder for cache system)';

-- =====================================================
-- FUNCTION: Check Feature Access (Simple)
-- =====================================================
CREATE OR REPLACE FUNCTION check_feature_access(
    auth_user_id UUID,
    feature_key TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_access BOOLEAN;
BEGIN
    -- Use get_user_access_matrix to check access
    SELECT 
        CASE feature_key
            WHEN 'notes' THEN notesAccess
            WHEN 'profile' THEN profileAccess
            WHEN 'analytics' THEN analyticsAccess
            WHEN 'community' THEN communityAccess
            WHEN 'ai' THEN aiAccess
            ELSE false
        END INTO v_has_access
    FROM get_user_access_matrix(auth_user_id);
    
    RETURN COALESCE(v_has_access, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_feature_access IS 'Simple boolean check for feature access';

-- =====================================================
-- FUNCTION: Check Resource Limit
-- =====================================================
CREATE OR REPLACE FUNCTION check_resource_limit(
    auth_user_id UUID,
    resource_type TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_limit INT;
    v_used INT;
    v_available INT;
    v_unlimited BOOLEAN;
BEGIN
    -- Get limit and usage from access matrix
    SELECT 
        CASE resource_type
            WHEN 'accounts' THEN accountsLimit
            WHEN 'strategies' THEN strategiesLimit
            WHEN 'trades' THEN tradesLimit
            ELSE 0
        END,
        CASE resource_type
            WHEN 'accounts' THEN accountsUsed
            WHEN 'strategies' THEN strategiesUsed
            WHEN 'trades' THEN tradesUsed
            ELSE 0
        END
    INTO v_limit, v_used
    FROM get_user_access_matrix(auth_user_id);
    
    -- Check if unlimited (-1)
    v_unlimited := v_limit = -1;
    
    -- Calculate available
    IF v_unlimited THEN
        v_available := -1;
    ELSE
        v_available := GREATEST(0, v_limit - v_used);
    END IF;
    
    RETURN jsonb_build_object(
        'resource_type', resource_type,
        'limit', v_limit,
        'used', v_used,
        'available', v_available,
        'unlimited', v_unlimited,
        'can_create', v_unlimited OR v_available > 0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_resource_limit IS 'Returns detailed resource limit information';

-- =====================================================
-- FUNCTION: Get Segment User IDs (for notifications)
-- =====================================================
CREATE OR REPLACE FUNCTION get_segment_user_ids(segment_type TEXT)
RETURNS UUID[] AS $$
BEGIN
    CASE segment_type
        WHEN 'all_users' THEN
            RETURN ARRAY(
                SELECT id FROM app_users 
                WHERE user_status = 'active'
            );
        WHEN 'trial_users' THEN
            RETURN ARRAY(
                SELECT id FROM app_users 
                WHERE subscription_status = 'trialing'
                AND user_status = 'active'
            );
        WHEN 'active_subscribers' THEN
            RETURN ARRAY(
                SELECT id FROM app_users 
                WHERE subscription_status = 'active'
                AND user_status = 'active'
            );
        WHEN 'expired_users' THEN
            RETURN ARRAY(
                SELECT id FROM app_users 
                WHERE subscription_status = 'expired'
                AND user_status = 'active'
            );
        WHEN 'premium_users' THEN
            RETURN ARRAY(
                SELECT DISTINCT au.id 
                FROM app_users au
                JOIN user_subscriptions us ON au.id = us.user_id
                JOIN subscription_plans sp ON us.plan_id = sp.id
                WHERE us.status = 'active'
                AND sp.plan_type IN ('premium', 'pro')
                AND au.user_status = 'active'
            );
        ELSE
            RETURN ARRAY[]::UUID[];
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_segment_user_ids IS 'Returns array of user IDs for a given segment type (for bulk notifications)';

-- =====================================================
-- FUNCTION: Aggregate Trade Notes for Date
-- =====================================================
CREATE OR REPLACE FUNCTION aggregate_trade_notes_for_date(
    target_user_id UUID,
    target_date DATE
)
RETURNS void AS $$
DECLARE
    v_journal_id UUID;
    v_aggregated_notes TEXT;
BEGIN
    -- Get journal ID for the date
    SELECT journal_id INTO v_journal_id
    FROM journal
    WHERE user_id = target_user_id
    AND journal_date = target_date;
    
    -- If no journal exists, create one
    IF v_journal_id IS NULL THEN
        INSERT INTO journal (user_id, journal_date, notes)
        VALUES (target_user_id, target_date, '')
        RETURNING journal_id INTO v_journal_id;
    END IF;
    
    -- Aggregate all trade notes for this date
    SELECT STRING_AGG(
        CONCAT(
            '📊 ', instrument, ' ', action, ' @ ', entry_price,
            CASE WHEN notes IS NOT NULL AND notes != '' 
                THEN E'\n' || notes 
                ELSE '' 
            END
        ),
        E'\n\n'
        ORDER BY entry_time
    ) INTO v_aggregated_notes
    FROM trades
    WHERE user_id = target_user_id
    AND trade_date = target_date
    AND notes IS NOT NULL
    AND notes != '';
    
    -- Update journal with aggregated notes
    UPDATE journal
    SET all_trades_notes = COALESCE(v_aggregated_notes, '')
    WHERE journal_id = v_journal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION aggregate_trade_notes_for_date IS 'Aggregates all trade notes for a specific date into journal';

-- =====================================================
-- FUNCTION: Update Journal Images Notes for Date
-- =====================================================
CREATE OR REPLACE FUNCTION update_journal_images_notes_for_date(
    target_user_id UUID,
    target_date DATE
)
RETURNS void AS $$
DECLARE
    v_journal_id UUID;
    v_aggregated_notes TEXT;
BEGIN
    -- Get journal ID for the date
    SELECT journal_id INTO v_journal_id
    FROM journal
    WHERE user_id = target_user_id
    AND journal_date = target_date;
    
    -- If no journal exists, create one
    IF v_journal_id IS NULL THEN
        INSERT INTO journal (user_id, journal_date, notes)
        VALUES (target_user_id, target_date, '')
        RETURNING journal_id INTO v_journal_id;
    END IF;
    
    -- Aggregate all image captions for this date
    SELECT STRING_AGG(
        CASE 
            WHEN caption IS NOT NULL AND caption != '' 
            THEN CONCAT('🖼️ ', image_name, E'\n', caption)
            ELSE CONCAT('🖼️ ', image_name)
        END,
        E'\n\n'
        ORDER BY created_at
    ) INTO v_aggregated_notes
    FROM journal_images
    WHERE user_id = target_user_id
    AND DATE(created_at) = target_date
    AND caption IS NOT NULL
    AND caption != '';
    
    -- Update journal with aggregated image notes
    UPDATE journal
    SET all_journal_images_notes = COALESCE(v_aggregated_notes, '')
    WHERE journal_id = v_journal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_journal_images_notes_for_date IS 'Aggregates all journal image captions for a specific date';

-- =====================================================
-- TRIGGER: Auto-aggregate trade notes on trade insert/update
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_aggregate_trade_notes()
RETURNS TRIGGER AS $$
BEGIN
    -- Aggregate notes for the trade date
    IF NEW.trade_date IS NOT NULL THEN
        PERFORM aggregate_trade_notes_for_date(NEW.user_id, NEW.trade_date);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_trade_notes_change
    AFTER INSERT OR UPDATE OF notes, trade_date ON trades
    FOR EACH ROW
    WHEN (NEW.notes IS NOT NULL AND NEW.notes != '')
    EXECUTE FUNCTION trigger_aggregate_trade_notes();

-- =====================================================
-- TRIGGER: Auto-aggregate journal image captions
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_aggregate_journal_image_captions()
RETURNS TRIGGER AS $$
BEGIN
    -- Aggregate captions for the image date
    PERFORM update_journal_images_notes_for_date(
        NEW.user_id, 
        DATE(NEW.created_at)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_journal_image_caption_change
    AFTER INSERT OR UPDATE OF caption ON journal_images
    FOR EACH ROW
    WHEN (NEW.caption IS NOT NULL AND NEW.caption != '')
    EXECUTE FUNCTION trigger_aggregate_journal_image_captions();

-- =====================================================
-- FUNCTION: Upsert User Subscription (Admin/Payment)
-- =====================================================
CREATE OR REPLACE FUNCTION upsert_user_subscription(
    target_user_id UUID,
    plan_name_param TEXT,
    billing_cycle_param TEXT DEFAULT 'monthly',
    start_date_param TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
    v_plan_id UUID;
    v_end_date TIMESTAMPTZ;
    v_subscription_id UUID;
BEGIN
    -- Get plan ID
    SELECT id INTO v_plan_id
    FROM subscription_plans
    WHERE name = plan_name_param
    AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Plan not found or inactive'
        );
    END IF;
    
    -- Calculate end date
    IF billing_cycle_param = 'monthly' THEN
        v_end_date := start_date_param + INTERVAL '1 month';
    ELSIF billing_cycle_param = 'yearly' THEN
        v_end_date := start_date_param + INTERVAL '1 year';
    ELSIF billing_cycle_param = 'lifetime' THEN
        v_end_date := start_date_param + INTERVAL '100 years';
    ELSE
        v_end_date := start_date_param + INTERVAL '1 month';
    END IF;
    
    -- Cancel existing active subscriptions
    UPDATE user_subscriptions
    SET status = 'cancelled',
        cancelled_at = NOW()
    WHERE user_id = target_user_id
    AND status IN ('active', 'trialing');
    
    -- Insert new subscription
    INSERT INTO user_subscriptions (
        user_id, plan_id, status, billing_cycle,
        current_period_start, current_period_end,
        next_billing_date, payment_gateway
    ) VALUES (
        target_user_id, v_plan_id, 'active', billing_cycle_param,
        start_date_param, v_end_date, v_end_date, 'manual'
    )
    RETURNING id INTO v_subscription_id;
    
    -- Update app_users
    UPDATE app_users
    SET subscription_status = 'active'
    WHERE id = target_user_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Subscription created/updated successfully',
        'subscription_id', v_subscription_id,
        'end_date', v_end_date
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION upsert_user_subscription IS 'Creates or updates user subscription (used by payment processors)';

-- =====================================================
-- Grant Permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION get_user_access_matrix TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION assign_user_plan TO authenticated;
GRANT EXECUTE ON FUNCTION invalidate_user_access_cache TO authenticated;
GRANT EXECUTE ON FUNCTION check_feature_access TO authenticated;
GRANT EXECUTE ON FUNCTION check_resource_limit TO authenticated;
GRANT EXECUTE ON FUNCTION get_segment_user_ids TO authenticated;
GRANT EXECUTE ON FUNCTION aggregate_trade_notes_for_date TO authenticated;
GRANT EXECUTE ON FUNCTION update_journal_images_notes_for_date TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_user_subscription TO authenticated;
