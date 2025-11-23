-- Migration: Missing Triggers from Old Database
-- Description: Adds triggers that existed in old database for data consistency
-- Dependencies: All previous migrations

-- =====================================================
-- NOTE: Auto-populate email trigger removed
-- =====================================================
-- The user_subscriptions table doesn't have a user_email column
-- Email can be retrieved via JOIN with app_users table
-- This is more normalized and prevents data duplication

-- =====================================================
-- NOTE: Sync plan_name trigger removed
-- =====================================================
-- The user_subscriptions table doesn't have a plan_name column
-- Plan name can be retrieved via JOIN with subscription_plans table
-- This is more normalized and prevents data duplication

-- =====================================================
-- TRIGGER: Sync trade images to trades table
-- =====================================================
-- Note: This syncs main_image and additional_images to trades table for easier querying

CREATE OR REPLACE FUNCTION sync_trade_images_to_trades()
RETURNS TRIGGER AS $$
DECLARE
    v_trade_id UUID;
    v_main_image TEXT;
    v_additional_images TEXT[];
BEGIN
    -- Get trade_id from NEW or OLD record
    v_trade_id := COALESCE(NEW.trade_id, OLD.trade_id);
    
    -- Get main image URL
    SELECT image_url INTO v_main_image
    FROM trade_images
    WHERE trade_id = v_trade_id
    AND image_type = 'main'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Get additional images as array
    SELECT ARRAY_AGG(image_url ORDER BY display_order, created_at)
    INTO v_additional_images
    FROM trade_images
    WHERE trade_id = v_trade_id
    AND image_type IN ('additional', 'chart', 'screenshot', 'analysis');
    
    -- Update trades table
    UPDATE trades
    SET 
        main_image = v_main_image,
        additional_images = COALESCE(v_additional_images, ARRAY[]::TEXT[])
    WHERE id = v_trade_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sync_trade_images_to_trades IS 'Syncs trade_images to trades.main_image and trades.additional_images columns';

-- Create triggers for INSERT, UPDATE, DELETE
CREATE TRIGGER trigger_sync_trade_images_insert
    AFTER INSERT ON trade_images
    FOR EACH ROW
    EXECUTE FUNCTION sync_trade_images_to_trades();

CREATE TRIGGER trigger_sync_trade_images_update
    AFTER UPDATE ON trade_images
    FOR EACH ROW
    EXECUTE FUNCTION sync_trade_images_to_trades();

CREATE TRIGGER trigger_sync_trade_images_delete
    AFTER DELETE ON trade_images
    FOR EACH ROW
    EXECUTE FUNCTION sync_trade_images_to_trades();

-- =====================================================
-- TRIGGER: Enhanced subscription change handler
-- =====================================================
-- This extends the existing notify_subscription_change to handle more events

CREATE OR REPLACE FUNCTION handle_subscription_change()
RETURNS TRIGGER AS $$
DECLARE
    v_old_status TEXT;
    v_new_status TEXT;
BEGIN
    -- Handle INSERT (new subscription)
    IF TG_OP = 'INSERT' THEN
        -- Log subscription creation
        INSERT INTO subscription_event_logs (
            user_id, subscription_id, event_type, new_status
        ) VALUES (
            NEW.user_id, NEW.id, 'subscription_created', NEW.status
        );
        
        -- Create welcome notification for new subscriptions
        IF NEW.status = 'active' THEN
            PERFORM create_notification(
                NEW.user_id,
                'subscription_activated',
                'Welcome to Premium!',
                'Your subscription is now active. Enjoy all premium features!',
                'navigate',
                '/dashboard',
                jsonb_build_object('subscription_id', NEW.id),
                'high'
            );
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE (status change)
    IF TG_OP = 'UPDATE' THEN
        v_old_status := OLD.status;
        v_new_status := NEW.status;
        
        -- Only process if status actually changed
        IF v_old_status IS DISTINCT FROM v_new_status THEN
            -- Log the change
            INSERT INTO subscription_event_logs (
                user_id, subscription_id, event_type, old_status, new_status
            ) VALUES (
                NEW.user_id, NEW.id, 'status_changed', v_old_status, v_new_status
            );
            
            -- Create appropriate notification (handled by existing notify_subscription_change)
            -- This trigger complements that one with additional logging
        END IF;
        
        -- Log plan changes
        IF OLD.plan_id IS DISTINCT FROM NEW.plan_id THEN
            INSERT INTO subscription_event_logs (
                user_id, subscription_id, event_type, 
                metadata
            ) VALUES (
                NEW.user_id, NEW.id, 'plan_changed',
                jsonb_build_object(
                    'old_plan_id', OLD.plan_id,
                    'new_plan_id', NEW.plan_id,
                    'old_plan_name', OLD.plan_name,
                    'new_plan_name', NEW.plan_name
                )
            );
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Handle DELETE (subscription cancelled/deleted)
    IF TG_OP = 'DELETE' THEN
        INSERT INTO subscription_event_logs (
            user_id, subscription_id, event_type, old_status
        ) VALUES (
            OLD.user_id, OLD.id, 'subscription_deleted', OLD.status
        );
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION handle_subscription_change IS 'Comprehensive subscription change handler with logging and notifications';

-- Create trigger for all subscription changes
CREATE TRIGGER subscription_change_trigger
    AFTER INSERT OR UPDATE OR DELETE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION handle_subscription_change();

-- =====================================================
-- TRIGGER: Settings updated_at (if not already exists)
-- =====================================================
-- Check if settings table exists and add trigger if needed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'settings') THEN
        -- Drop if exists to avoid conflicts
        DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
        
        -- Create trigger
        CREATE TRIGGER update_settings_updated_at 
            BEFORE UPDATE ON settings
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =====================================================
-- Additional Utility Triggers
-- =====================================================

-- TRIGGER: Validate subscription dates
CREATE OR REPLACE FUNCTION validate_subscription_dates()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure end date is after start date
    IF NEW.current_period_end IS NOT NULL AND NEW.current_period_start IS NOT NULL THEN
        IF NEW.current_period_end <= NEW.current_period_start THEN
            RAISE EXCEPTION 'Subscription end date must be after start date';
        END IF;
    END IF;
    
    -- Ensure next billing date is in the future for active subscriptions
    IF NEW.status = 'active' AND NEW.next_billing_date IS NOT NULL THEN
        IF NEW.next_billing_date < NOW() THEN
            -- Auto-correct to end of current period
            NEW.next_billing_date := NEW.current_period_end;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_subscription_dates IS 'Validates and auto-corrects subscription date logic';

CREATE TRIGGER validate_subscription_dates_trigger
    BEFORE INSERT OR UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION validate_subscription_dates();

-- TRIGGER: Auto-set trade status based on exit data
CREATE OR REPLACE FUNCTION auto_set_trade_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If exit_price is set but status is still 'open', change to 'closed'
    IF NEW.exit_price IS NOT NULL AND NEW.status = 'open' THEN
        NEW.status := 'closed';
    END IF;
    
    -- If exit_price is removed, change status back to 'open'
    IF NEW.exit_price IS NULL AND OLD.exit_price IS NOT NULL AND NEW.status = 'closed' THEN
        NEW.status := 'open';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_set_trade_status IS 'Automatically sets trade status based on exit_price';

CREATE TRIGGER auto_set_trade_status_trigger
    BEFORE INSERT OR UPDATE OF exit_price, status ON trades
    FOR EACH ROW
    EXECUTE FUNCTION auto_set_trade_status();

-- =====================================================
-- TRIGGER: Prevent orphaned records
-- =====================================================

-- Ensure trade_images have valid trade_id
CREATE OR REPLACE FUNCTION validate_trade_image_references()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure trade exists
    IF NOT EXISTS (SELECT 1 FROM trades WHERE id = NEW.trade_id) THEN
        RAISE EXCEPTION 'Cannot add image to non-existent trade';
    END IF;
    
    -- Ensure user owns the trade
    IF NOT EXISTS (SELECT 1 FROM trades WHERE id = NEW.trade_id AND user_id = NEW.user_id) THEN
        RAISE EXCEPTION 'User does not own this trade';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_trade_image_references IS 'Validates trade_images references before insert';

CREATE TRIGGER validate_trade_image_references_trigger
    BEFORE INSERT ON trade_images
    FOR EACH ROW
    EXECUTE FUNCTION validate_trade_image_references();

-- =====================================================
-- Grant necessary permissions
-- =====================================================
-- All triggers run with definer privileges, no additional grants needed
