-- Migration: Fix Partial Exits Trigger
-- Description: Updates trigger to calculate metrics for partially_closed trades
-- Date: February 8, 2026

-- =====================================================
-- TRIGGER FUNCTION: Calculate trade metrics (Updated)
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_calculate_trade_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate metrics for both closed AND partially_closed trades with exit price
    IF (NEW.status = 'closed' OR NEW.status = 'partially_closed') AND NEW.exit_price IS NOT NULL THEN
        PERFORM calculate_trade_metrics(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION trigger_calculate_trade_metrics IS 'Triggers trade metrics calculation when trade is closed or partially closed';
