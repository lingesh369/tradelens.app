-- Migration: Add Missing Columns to Trading Tables
-- Description: Adds columns from old schema that are missing in new schema
-- Dependencies: Phase 3 (accounts, strategies, tags), Phase 4 (trades)

-- =====================================================
-- TRADES TABLE - Add missing columns
-- =====================================================

-- Add trade_rating column (separate from rating)
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS trade_rating INT CHECK (trade_rating IS NULL OR (trade_rating BETWEEN 1 AND 5));

-- Add total_exit_quantity for tracking partial exits
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS total_exit_quantity DECIMAL(15,4) DEFAULT 0;

-- Add JSONB columns for flexible data storage
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS partial_exits JSONB;

ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS tags JSONB;

ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS additional_images JSONB;

COMMENT ON COLUMN trades.trade_rating IS 'User rating of the trade (1-5), separate from strategy rating';
COMMENT ON COLUMN trades.total_exit_quantity IS 'Total quantity exited through partial exits';
COMMENT ON COLUMN trades.partial_exits IS 'JSONB array of partial exit records';
COMMENT ON COLUMN trades.tags IS 'JSONB array of tag names or IDs';
COMMENT ON COLUMN trades.additional_images IS 'JSONB array of additional image URLs';

CREATE INDEX IF NOT EXISTS idx_trades_tags ON trades USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_trades_partial_exits ON trades USING GIN (partial_exits);

-- =====================================================
-- ACCOUNTS TABLE - Add missing columns from old schema
-- =====================================================

-- Add commission and fees tracking columns
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS commission DECIMAL(15,2) DEFAULT 0;

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS fees DECIMAL(15,2) DEFAULT 0;

COMMENT ON COLUMN accounts.commission IS 'Total commissions paid on this account';
COMMENT ON COLUMN accounts.fees IS 'Total fees paid on this account';

-- =====================================================
-- STRATEGIES TABLE - Add missing columns from old schema
-- =====================================================

-- Add notes column for strategy documentation
ALTER TABLE strategies 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add sharing fields
ALTER TABLE strategies 
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false;

ALTER TABLE strategies 
ADD COLUMN IF NOT EXISTS shared_at TIMESTAMPTZ;

ALTER TABLE strategies 
ADD COLUMN IF NOT EXISTS shared_by_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL;

-- Add performance tracking columns
ALTER TABLE strategies 
ADD COLUMN IF NOT EXISTS losses INT DEFAULT 0;

ALTER TABLE strategies 
ADD COLUMN IF NOT EXISTS net_pl DECIMAL(15,2) DEFAULT 0;

COMMENT ON COLUMN strategies.notes IS 'Additional notes and documentation for the strategy';
COMMENT ON COLUMN strategies.is_shared IS 'Whether this strategy is shared with community';
COMMENT ON COLUMN strategies.shared_at IS 'When the strategy was shared';
COMMENT ON COLUMN strategies.shared_by_user_id IS 'User who shared this strategy (for re-sharing)';
COMMENT ON COLUMN strategies.losses IS 'Number of losing trades (alias for losing_trades)';
COMMENT ON COLUMN strategies.net_pl IS 'Net profit/loss for this strategy (alias for total_pnl)';

-- =====================================================
-- TAGS TABLE - Add missing columns from old schema
-- =====================================================

-- Add linked_trades and linked_strategies for tracking usage
ALTER TABLE tags 
ADD COLUMN IF NOT EXISTS linked_trades TEXT;

ALTER TABLE tags 
ADD COLUMN IF NOT EXISTS linked_strategies TEXT;

COMMENT ON COLUMN tags.linked_trades IS 'Comma-separated list of trade IDs using this tag (legacy field)';
COMMENT ON COLUMN tags.linked_strategies IS 'Comma-separated list of strategy IDs using this tag (legacy field)';

-- =====================================================
-- COMMISSIONS TABLE - Add missing columns from old schema
-- =====================================================

-- Add total_fees column (sum of commission + fees)
ALTER TABLE commissions 
ADD COLUMN IF NOT EXISTS commission DECIMAL(15,2);

ALTER TABLE commissions 
ADD COLUMN IF NOT EXISTS fees DECIMAL(15,2);

ALTER TABLE commissions 
ADD COLUMN IF NOT EXISTS total_fees DECIMAL(15,2) GENERATED ALWAYS AS (
  COALESCE(commission, 0) + COALESCE(fees, 0)
) STORED;

COMMENT ON COLUMN commissions.commission IS 'Commission amount';
COMMENT ON COLUMN commissions.fees IS 'Additional fees';
COMMENT ON COLUMN commissions.total_fees IS 'Total of commission + fees (calculated)';

-- =====================================================
-- TRADE_METRICS TABLE - Add column aliases for frontend compatibility
-- =====================================================

-- Add aliases for P&L columns that frontend expects
ALTER TABLE trade_metrics 
ADD COLUMN IF NOT EXISTS net_p_and_l DECIMAL(15,2) GENERATED ALWAYS AS (net_pnl) STORED;

ALTER TABLE trade_metrics 
ADD COLUMN IF NOT EXISTS gross_p_and_l DECIMAL(15,2) GENERATED ALWAYS AS (gross_pnl) STORED;

-- Add pnl as alias for net_pnl
ALTER TABLE trade_metrics 
ADD COLUMN IF NOT EXISTS pnl DECIMAL(15,2) GENERATED ALWAYS AS (net_pnl) STORED;

-- Add r2r as alias for r_multiple
ALTER TABLE trade_metrics 
ADD COLUMN IF NOT EXISTS r2r DECIMAL(10,2) GENERATED ALWAYS AS (r_multiple) STORED;

-- Add trade_outcome as alias for trade_result
ALTER TABLE trade_metrics 
ADD COLUMN IF NOT EXISTS trade_outcome TEXT GENERATED ALWAYS AS (trade_result) STORED;

COMMENT ON COLUMN trade_metrics.net_p_and_l IS 'Alias for net_pnl (frontend compatibility)';
COMMENT ON COLUMN trade_metrics.gross_p_and_l IS 'Alias for gross_pnl (frontend compatibility)';
COMMENT ON COLUMN trade_metrics.pnl IS 'Alias for net_pnl (frontend compatibility)';
COMMENT ON COLUMN trade_metrics.r2r IS 'Alias for r_multiple (frontend compatibility)';
COMMENT ON COLUMN trade_metrics.trade_outcome IS 'Alias for trade_result (frontend compatibility)';

-- =====================================================
-- Grant permissions
-- =====================================================

GRANT ALL ON TABLE trades TO authenticated;
GRANT ALL ON TABLE accounts TO authenticated;
GRANT ALL ON TABLE strategies TO authenticated;
GRANT ALL ON TABLE tags TO authenticated;
GRANT ALL ON TABLE commissions TO authenticated;
GRANT ALL ON TABLE trade_metrics TO authenticated;
