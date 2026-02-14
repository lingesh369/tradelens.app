-- Migration: Fix Partial Exits Metrics Calculation
-- Description: Updates calculate_trade_metrics to properly handle partial exits
-- Date: February 8, 2026

-- =====================================================
-- FUNCTION: Calculate trade metrics (Updated for Partial Exits)
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_trade_metrics(p_trade_id UUID)
RETURNS void AS $$
DECLARE
    v_trade RECORD;
    v_gross_pnl DECIMAL(15,2);
    v_net_pnl DECIMAL(15,2);
    v_percent_gain DECIMAL(10,4);
    v_r_multiple DECIMAL(10,2);
    v_risk_amount DECIMAL(15,2);
    v_trade_result TEXT;
    v_duration INTERVAL;
    v_duration_minutes INT;
    v_total_quantity DECIMAL(15,4);
    v_weighted_exit_price DECIMAL(15,4);
BEGIN
    -- Get trade details
    SELECT * INTO v_trade
    FROM trades
    WHERE id = p_trade_id;
    
    -- Calculate metrics for closed AND partially_closed trades
    IF v_trade.status NOT IN ('closed', 'partially_closed') OR v_trade.exit_price IS NULL THEN
        RETURN;
    END IF;
    
    -- Determine the quantity to use for calculations
    -- For partially closed trades, use total_exit_quantity
    -- For fully closed trades, use the full quantity
    IF v_trade.status = 'partially_closed' AND v_trade.total_exit_quantity IS NOT NULL THEN
        v_total_quantity := v_trade.total_exit_quantity;
    ELSE
        v_total_quantity := v_trade.quantity;
    END IF;
    
    -- Use the weighted exit price from the trade record
    -- (This should be calculated when partial exits are added)
    v_weighted_exit_price := v_trade.exit_price;
    
    -- Calculate gross P&L based on the exited quantity
    IF v_trade.action IN ('long', 'buy') THEN
        v_gross_pnl := (v_weighted_exit_price - v_trade.entry_price) * v_total_quantity;
    ELSE -- short/sell
        v_gross_pnl := (v_trade.entry_price - v_weighted_exit_price) * v_total_quantity;
    END IF;
    
    -- Apply contract multiplier if exists
    IF v_trade.contract_multiplier IS NOT NULL THEN
        v_gross_pnl := v_gross_pnl * v_trade.contract_multiplier;
    END IF;
    
    -- Calculate net P&L (after costs)
    v_net_pnl := v_gross_pnl - COALESCE(v_trade.commission, 0) - COALESCE(v_trade.fees, 0);
    
    -- Calculate percentage gain based on the cost basis of exited quantity
    v_percent_gain := (v_net_pnl / (v_trade.entry_price * v_total_quantity)) * 100;
    
    -- Calculate risk amount (distance to stop loss) based on original quantity
    IF v_trade.sl IS NOT NULL THEN
        IF v_trade.action IN ('long', 'buy') THEN
            v_risk_amount := (v_trade.entry_price - v_trade.sl) * v_trade.quantity;
        ELSE
            v_risk_amount := (v_trade.sl - v_trade.entry_price) * v_trade.quantity;
        END IF;
        
        -- Calculate R-multiple
        IF v_risk_amount > 0 THEN
            v_r_multiple := v_net_pnl / v_risk_amount;
        END IF;
    END IF;
    
    -- Determine trade result
    IF v_net_pnl > 0 THEN
        v_trade_result := 'win';
    ELSIF v_net_pnl < 0 THEN
        v_trade_result := 'loss';
    ELSE
        v_trade_result := 'breakeven';
    END IF;
    
    -- Calculate duration
    IF v_trade.exit_time IS NOT NULL THEN
        v_duration := v_trade.exit_time - v_trade.entry_time;
        v_duration_minutes := EXTRACT(EPOCH FROM v_duration) / 60;
    END IF;
    
    -- Insert or update trade_metrics
    INSERT INTO trade_metrics (
        trade_id, user_id, gross_pnl, net_pnl, percent_gain,
        r_multiple, risk_amount, trade_result, trade_duration, trade_duration_minutes
    ) VALUES (
        p_trade_id, v_trade.user_id, v_gross_pnl, v_net_pnl, v_percent_gain,
        v_r_multiple, v_risk_amount, v_trade_result, v_duration, v_duration_minutes
    )
    ON CONFLICT (trade_id) DO UPDATE SET
        gross_pnl = EXCLUDED.gross_pnl,
        net_pnl = EXCLUDED.net_pnl,
        percent_gain = EXCLUDED.percent_gain,
        r_multiple = EXCLUDED.r_multiple,
        risk_amount = EXCLUDED.risk_amount,
        trade_result = EXCLUDED.trade_result,
        trade_duration = EXCLUDED.trade_duration,
        trade_duration_minutes = EXCLUDED.trade_duration_minutes,
        calculated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_trade_metrics IS 'Calculates and stores performance metrics for closed and partially closed trades';

-- =====================================================
-- Recalculate metrics for all partially_closed trades
-- =====================================================
DO $$
DECLARE
    v_trade_id UUID;
BEGIN
    FOR v_trade_id IN 
        SELECT id FROM trades WHERE status = 'partially_closed'
    LOOP
        PERFORM calculate_trade_metrics(v_trade_id);
    END LOOP;
END $$;
