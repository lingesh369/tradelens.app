-- Migration: Fix community metrics sync
-- Description: Ensures trader_profiles stats update when trade_metrics are updated (on every trade calculation)
-- Safety: Additive only. No tables or columns deleted.

-- 1. Create a function to trigger trader profile sync from trade_metrics
CREATE OR REPLACE FUNCTION trigger_sync_profile_from_metrics()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get user_id from the trade
    SELECT user_id INTO v_user_id
    FROM trades
    WHERE id = NEW.trade_id;

    IF v_user_id IS NOT NULL THEN
        -- Call the existing sync function
        -- We re-use update_trader_profile_stats logic via a direct call or by mocking a trade update
        -- Since update_trader_profile_stats is defined in phase 8, we can call it.
        PERFORM update_trader_profile_stats_by_user(v_user_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create a specific helper to update by user_id to avoid trigger logic overhead
CREATE OR REPLACE FUNCTION update_trader_profile_stats_by_user(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_total_trades INT;
    v_win_rate DECIMAL(5,2);
    v_total_pnl DECIMAL(15,2);
    v_winning_trades INT;
BEGIN
    -- Calculate statistics
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE tm.trade_result = 'win'),
        SUM(tm.net_pnl)
    INTO v_total_trades, v_winning_trades, v_total_pnl
    FROM trades t
    LEFT JOIN trade_metrics tm ON t.id = tm.trade_id
    WHERE t.user_id = p_user_id
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
        total_pnl = COALESCE(v_total_pnl, 0),
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Add trigger to trade_metrics table
DROP TRIGGER IF EXISTS on_metrics_update_sync_profile ON trade_metrics;
CREATE TRIGGER on_metrics_update_sync_profile
    AFTER INSERT OR UPDATE ON trade_metrics
    FOR EACH ROW EXECUTE FUNCTION trigger_sync_profile_from_metrics();

-- 4. Audit: Ensure existing profiles are synced
-- This is safe and only updates counts/rates.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM app_users LOOP
        PERFORM update_trader_profile_stats_by_user(r.id);
    END LOOP;
END $$;
