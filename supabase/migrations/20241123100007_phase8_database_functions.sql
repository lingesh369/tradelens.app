-- Migration: Phase 8 - Database Functions & Triggers
-- Description: Creates trigger functions and automated database logic
-- Dependencies: All previous phases

-- =====================================================
-- TRIGGER FUNCTION: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION update_updated_at_column IS 'Automatically updates updated_at timestamp on row modification';

-- Apply to all tables with updated_at column
CREATE TRIGGER update_app_users_updated_at BEFORE UPDATE ON app_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trader_profiles_updated_at BEFORE UPDATE ON trader_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON strategies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategy_rules_updated_at BEFORE UPDATE ON strategy_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON commissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trade_images_updated_at BEFORE UPDATE ON trade_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partial_exits_updated_at BEFORE UPDATE ON partial_exits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trade_comments_updated_at BEFORE UPDATE ON trade_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_updated_at BEFORE UPDATE ON journal
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_images_updated_at BEFORE UPDATE ON journal_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_push_tokens_updated_at BEFORE UPDATE ON user_push_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_commissions_updated_at BEFORE UPDATE ON affiliate_commissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER FUNCTION: Handle new user signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_signup()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_username TEXT;
    v_first_name TEXT;
    v_last_name TEXT;
    v_signup_source TEXT;
    v_referred_by TEXT;
    v_affiliate_code TEXT;
    v_default_plan_id UUID;
    v_retry_count INT := 0;
    v_max_retries INT := 3;
    v_error_message TEXT;
BEGIN
    -- Extract metadata from auth.users
    v_first_name := NEW.raw_user_meta_data->>'first_name';
    v_last_name := NEW.raw_user_meta_data->>'last_name';
    v_username := NEW.raw_user_meta_data->>'username';
    v_signup_source := COALESCE(NEW.raw_user_meta_data->>'signup_source', 
                                 COALESCE(NEW.raw_app_meta_data->>'provider', 'web'));
    v_referred_by := NEW.raw_user_meta_data->>'referred_by';
    
    -- Generate username if not provided
    IF v_username IS NULL OR v_username = '' THEN
        v_username := generate_username_from_email(NEW.email);
    END IF;
    
    -- Generate unique affiliate code
    v_affiliate_code := generate_affiliate_code();
    
    -- Retry loop for profile creation
    WHILE v_retry_count < v_max_retries LOOP
        BEGIN
            -- Create app_users record
            INSERT INTO app_users (
                id, email, username, first_name, last_name, affiliate_code,
                referred_by, subscription_status, trial_end_date,
                signup_source, email_verified, profile_completed
            ) VALUES (
                NEW.id, NEW.email, v_username, v_first_name, v_last_name, v_affiliate_code,
                v_referred_by, 'trialing', NOW() + INTERVAL '7 days',
                v_signup_source, NEW.email_confirmed_at IS NOT NULL, false
            );
            
            -- Create trader_profiles record
            INSERT INTO trader_profiles (user_id)
            VALUES (NEW.id);
            
            -- Create default user_settings
            INSERT INTO user_settings (user_id, key, value) VALUES
                (NEW.id, 'theme', '"light"'),
                (NEW.id, 'currency', '"USD"'),
                (NEW.id, 'timezone', '"UTC"'),
                (NEW.id, 'notifications', '{"email": true, "push": true, "in_app": true}');
            
            -- Get default plan
            SELECT id INTO v_default_plan_id
            FROM subscription_plans
            WHERE is_default = true
            LIMIT 1;
            
            -- Create trial subscription
            IF v_default_plan_id IS NOT NULL THEN
                INSERT INTO user_subscriptions (
                    user_id, plan_id, status, billing_cycle,
                    current_period_start, current_period_end,
                    next_billing_date, payment_gateway
                ) VALUES (
                    NEW.id, v_default_plan_id, 'trialing', 'monthly',
                    NOW(), NOW() + INTERVAL '7 days',
                    NOW() + INTERVAL '7 days', 'trial'
                );
            END IF;
            
            -- Log successful creation
            INSERT INTO user_creation_log (
                user_id, auth_user_id, email, signup_method,
                signup_source, profile_created, profile_creation_attempts
            ) VALUES (
                NEW.id, NEW.id, NEW.email,
                COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
                v_signup_source, true, v_retry_count + 1
            );
            
            -- Success - exit loop
            EXIT;
            
        EXCEPTION WHEN OTHERS THEN
            v_retry_count := v_retry_count + 1;
            v_error_message := SQLERRM;
            
            IF v_retry_count >= v_max_retries THEN
                -- Log failed creation
                INSERT INTO user_creation_log (
                    auth_user_id, email, signup_method, signup_source,
                    profile_created, profile_creation_attempts, profile_creation_error
                ) VALUES (
                    NEW.id, NEW.email,
                    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
                    v_signup_source, false, v_retry_count, v_error_message
                );
                
                RAISE EXCEPTION 'Failed to create user profile after % attempts: %', v_max_retries, v_error_message;
            END IF;
            
            -- Wait before retry (exponential backoff)
            PERFORM pg_sleep(POWER(2, v_retry_count - 1));
        END;
    END LOOP;
    
    RETURN NEW;
END;
$$;

-- Comments
COMMENT ON FUNCTION public.handle_new_signup IS 'Automatically creates app_users, trader_profiles, settings, and trial subscription on auth.users insert';

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_signup();

-- =====================================================
-- TRIGGER FUNCTION: Auto-populate trade_date from entry_time
-- =====================================================
CREATE OR REPLACE FUNCTION set_trade_date()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-populate trade_date from entry_time if not set
    IF NEW.trade_date IS NULL AND NEW.entry_time IS NOT NULL THEN
        NEW.trade_date := NEW.entry_time::DATE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION set_trade_date IS 'Automatically sets trade_date from entry_time if not provided';

-- Create trigger on trades
CREATE TRIGGER on_trade_set_date
    BEFORE INSERT OR UPDATE OF entry_time ON trades
    FOR EACH ROW EXECUTE FUNCTION set_trade_date();

-- =====================================================
-- TRIGGER FUNCTION: Calculate trade metrics on trade close
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_calculate_trade_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Only calculate if trade is closed and has exit price
    IF NEW.status = 'closed' AND NEW.exit_price IS NOT NULL THEN
        PERFORM calculate_trade_metrics(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION trigger_calculate_trade_metrics IS 'Triggers trade metrics calculation when trade is closed';

-- Create trigger on trades
CREATE TRIGGER on_trade_closed
    AFTER INSERT OR UPDATE OF status, exit_price ON trades
    FOR EACH ROW EXECUTE FUNCTION trigger_calculate_trade_metrics();

-- =====================================================
-- TRIGGER FUNCTION: Update account balance on trade close
-- =====================================================
CREATE OR REPLACE FUNCTION update_account_balance_on_trade()
RETURNS TRIGGER AS $$
DECLARE
    v_net_pnl DECIMAL(15,2);
BEGIN
    -- Only update if trade is closed and has account
    IF NEW.status = 'closed' AND NEW.account_id IS NOT NULL THEN
        -- Get net P&L from trade_metrics
        SELECT net_pnl INTO v_net_pnl
        FROM trade_metrics
        WHERE trade_id = NEW.id;
        
        -- Update account balance
        IF v_net_pnl IS NOT NULL THEN
            UPDATE accounts
            SET current_balance = current_balance + v_net_pnl
            WHERE id = NEW.account_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION update_account_balance_on_trade IS 'Updates account balance when trade is closed';

-- Create trigger on trades
CREATE TRIGGER on_trade_closed_update_account
    AFTER INSERT OR UPDATE OF status ON trades
    FOR EACH ROW EXECUTE FUNCTION update_account_balance_on_trade();

-- =====================================================
-- TRIGGER FUNCTION: Update strategy statistics
-- =====================================================
CREATE OR REPLACE FUNCTION update_strategy_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_strategy_id UUID;
    v_total_trades INT;
    v_winning_trades INT;
    v_losing_trades INT;
    v_win_rate DECIMAL(5,2);
    v_total_pnl DECIMAL(15,2);
BEGIN
    v_strategy_id := COALESCE(NEW.strategy_id, OLD.strategy_id);
    
    IF v_strategy_id IS NOT NULL THEN
        -- Calculate statistics
        SELECT 
            COUNT(*),
            COUNT(*) FILTER (WHERE tm.trade_result = 'win'),
            COUNT(*) FILTER (WHERE tm.trade_result = 'loss'),
            SUM(tm.net_pnl)
        INTO v_total_trades, v_winning_trades, v_losing_trades, v_total_pnl
        FROM trades t
        LEFT JOIN trade_metrics tm ON t.id = tm.trade_id
        WHERE t.strategy_id = v_strategy_id
        AND t.status = 'closed';
        
        -- Calculate win rate
        IF v_total_trades > 0 THEN
            v_win_rate := (v_winning_trades::DECIMAL / v_total_trades) * 100;
        ELSE
            v_win_rate := 0;
        END IF;
        
        -- Update strategy
        UPDATE strategies
        SET 
            total_trades = v_total_trades,
            winning_trades = v_winning_trades,
            losing_trades = v_losing_trades,
            win_rate = v_win_rate,
            total_pnl = COALESCE(v_total_pnl, 0)
        WHERE id = v_strategy_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION update_strategy_stats IS 'Updates strategy statistics when trades are added/modified';

-- Create trigger on trades
CREATE TRIGGER on_trade_strategy_stats
    AFTER INSERT OR UPDATE OF strategy_id, status ON trades
    FOR EACH ROW EXECUTE FUNCTION update_strategy_stats();

CREATE TRIGGER on_trade_delete_strategy_stats
    AFTER DELETE ON trades
    FOR EACH ROW EXECUTE FUNCTION update_strategy_stats();

-- =====================================================
-- TRIGGER FUNCTION: Update trader profile statistics
-- =====================================================
CREATE OR REPLACE FUNCTION update_trader_profile_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_total_trades INT;
    v_win_rate DECIMAL(5,2);
    v_total_pnl DECIMAL(15,2);
    v_winning_trades INT;
BEGIN
    v_user_id := COALESCE(NEW.user_id, OLD.user_id);
    
    -- Calculate statistics
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE tm.trade_result = 'win'),
        SUM(tm.net_pnl)
    INTO v_total_trades, v_winning_trades, v_total_pnl
    FROM trades t
    LEFT JOIN trade_metrics tm ON t.id = tm.trade_id
    WHERE t.user_id = v_user_id
    AND t.status = 'closed';
    
    -- Calculate win rate
    IF v_total_trades > 0 THEN
        v_win_rate := (v_winning_trades::DECIMAL / v_total_trades) * 100;
    ELSE
        v_win_rate := 0;
    END IF;
    
    -- Update trader profile
    UPDATE trader_profiles
    SET 
        total_trades = v_total_trades,
        win_rate = v_win_rate,
        total_pnl = COALESCE(v_total_pnl, 0)
    WHERE user_id = v_user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION update_trader_profile_stats IS 'Updates trader profile statistics when trades are added/modified';

-- Create trigger on trades
CREATE TRIGGER on_trade_profile_stats
    AFTER INSERT OR UPDATE OF status ON trades
    FOR EACH ROW EXECUTE FUNCTION update_trader_profile_stats();

CREATE TRIGGER on_trade_delete_profile_stats
    AFTER DELETE ON trades
    FOR EACH ROW EXECUTE FUNCTION update_trader_profile_stats();

-- =====================================================
-- TRIGGER FUNCTION: Update tag usage count
-- =====================================================
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tags
        SET usage_count = usage_count + 1
        WHERE id = NEW.tag_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tags
        SET usage_count = GREATEST(usage_count - 1, 0)
        WHERE id = OLD.tag_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION update_tag_usage_count IS 'Updates tag usage count when trade_tags are added/removed';

-- Create trigger on trade_tags
CREATE TRIGGER on_trade_tag_insert
    AFTER INSERT ON trade_tags
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

CREATE TRIGGER on_trade_tag_delete
    AFTER DELETE ON trade_tags
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- =====================================================
-- TRIGGER FUNCTION: Update coupon usage count
-- =====================================================
CREATE OR REPLACE FUNCTION update_coupon_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE coupons
    SET usage_count = usage_count + 1
    WHERE id = NEW.coupon_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION update_coupon_usage_count IS 'Increments coupon usage count when coupon is used';

-- Create trigger on coupon_usage
CREATE TRIGGER on_coupon_used
    AFTER INSERT ON coupon_usage
    FOR EACH ROW EXECUTE FUNCTION update_coupon_usage_count();

-- =====================================================
-- TRIGGER FUNCTION: Create notification on subscription change
-- =====================================================
CREATE OR REPLACE FUNCTION notify_subscription_change()
RETURNS TRIGGER AS $$
DECLARE
    v_title TEXT;
    v_message TEXT;
    v_notification_type TEXT;
BEGIN
    -- Only notify on status change
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        CASE NEW.status
            WHEN 'active' THEN
                v_title := 'Subscription Activated';
                v_message := 'Your subscription is now active. Enjoy all premium features!';
                v_notification_type := 'subscription_activated';
            WHEN 'expired' THEN
                v_title := 'Subscription Expired';
                v_message := 'Your subscription has expired. Renew now to continue using premium features.';
                v_notification_type := 'subscription_expired';
            WHEN 'cancelled' THEN
                v_title := 'Subscription Cancelled';
                v_message := 'Your subscription has been cancelled. You can reactivate anytime.';
                v_notification_type := 'subscription_cancelled';
            WHEN 'past_due' THEN
                v_title := 'Payment Failed';
                v_message := 'Your payment failed. Please update your payment method to continue.';
                v_notification_type := 'payment_failed';
            ELSE
                RETURN NEW;
        END CASE;
        
        -- Create notification
        PERFORM create_notification(
            NEW.user_id,
            v_notification_type,
            v_title,
            v_message,
            'navigate',
            '/settings/subscription',
            jsonb_build_object('subscription_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status),
            'high'
        );
        
        -- Log subscription event
        INSERT INTO subscription_event_logs (
            user_id, subscription_id, event_type, old_status, new_status
        ) VALUES (
            NEW.user_id, NEW.id, 'status_changed', OLD.status, NEW.status
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION notify_subscription_change IS 'Creates notification when subscription status changes';

-- Create trigger on user_subscriptions
CREATE TRIGGER on_subscription_status_change
    AFTER UPDATE OF status ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION notify_subscription_change();

-- =====================================================
-- TRIGGER FUNCTION: Sync app_users subscription status
-- =====================================================
CREATE OR REPLACE FUNCTION sync_app_users_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update app_users subscription_status to match
    UPDATE app_users
    SET subscription_status = NEW.status
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION sync_app_users_subscription_status IS 'Syncs subscription status from user_subscriptions to app_users';

-- Create trigger on user_subscriptions
CREATE TRIGGER on_subscription_sync_status
    AFTER INSERT OR UPDATE OF status ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION sync_app_users_subscription_status();
