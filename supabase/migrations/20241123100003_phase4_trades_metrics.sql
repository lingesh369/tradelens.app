-- Migration: Phase 4 - Trades & Metrics
-- Description: Creates trades table, trade metrics, images, and partial exits
-- Dependencies: Phase 1 (app_users), Phase 3 (accounts, strategies, tags)

-- =====================================================
-- TABLE: trades
-- Description: Main trades table with entry/exit data
-- =====================================================
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
    
    -- Trade basics
    instrument TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('long', 'short', 'buy', 'sell')),
    market_type TEXT CHECK (market_type IN ('stocks', 'forex', 'crypto', 'futures', 'options', 'commodities')),
    
    -- Entry details
    entry_price DECIMAL(15,4) NOT NULL,
    quantity DECIMAL(15,4) NOT NULL,
    entry_time TIMESTAMPTZ NOT NULL,
    
    -- Exit details
    exit_price DECIMAL(15,4),
    exit_time TIMESTAMPTZ,
    remaining_quantity DECIMAL(15,4),
    
    -- Status
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'partially_closed', 'closed', 'cancelled')),
    
    -- Risk management
    sl DECIMAL(15,4),
    target DECIMAL(15,4),
    
    -- Costs
    commission DECIMAL(15,2) DEFAULT 0,
    fees DECIMAL(15,2) DEFAULT 0,
    
    -- Additional info
    notes TEXT,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    trade_time_frame TEXT,
    chart_link TEXT, -- Link to external chart (TradingView, etc.)
    trade_date DATE, -- Separate date field for easier querying
    
    -- Sharing
    is_shared BOOLEAN DEFAULT false,
    shared_at TIMESTAMPTZ,
    shared_by_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL, -- For re-sharing functionality
    
    -- Images
    main_image TEXT,
    
    -- Futures/Options specific
    contract TEXT,
    contract_multiplier DECIMAL(10,2),
    tick_size DECIMAL(10,4),
    tick_value DECIMAL(10,2),
    
    -- Partial exits
    parent_trade_id UUID REFERENCES trades(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_quantity CHECK (quantity > 0),
    CONSTRAINT positive_entry_price CHECK (entry_price > 0),
    CONSTRAINT positive_exit_price CHECK (exit_price IS NULL OR exit_price > 0),
    CONSTRAINT valid_exit_time CHECK (exit_time IS NULL OR exit_time >= entry_time),
    CONSTRAINT valid_remaining_quantity CHECK (remaining_quantity IS NULL OR (remaining_quantity >= 0 AND remaining_quantity <= quantity))
);

-- Indexes for trades
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_account_id ON trades(account_id);
CREATE INDEX idx_trades_strategy_id ON trades(strategy_id);
CREATE INDEX idx_trades_entry_time ON trades(entry_time DESC);
CREATE INDEX idx_trades_trade_date ON trades(user_id, trade_date DESC) WHERE trade_date IS NOT NULL;
CREATE INDEX idx_trades_status ON trades(user_id, status);
CREATE INDEX idx_trades_is_shared ON trades(is_shared, shared_at DESC) WHERE is_shared = true;
CREATE INDEX idx_trades_instrument ON trades(instrument);
CREATE INDEX idx_trades_market_type ON trades(market_type);
CREATE INDEX idx_trades_parent_trade_id ON trades(parent_trade_id) WHERE parent_trade_id IS NOT NULL;
CREATE INDEX idx_trades_shared_by_user_id ON trades(shared_by_user_id) WHERE shared_by_user_id IS NOT NULL;

-- Comments
COMMENT ON TABLE trades IS 'Main trades table with entry, exit, and performance data';
COMMENT ON COLUMN trades.action IS 'Trade direction: long/buy (expecting price increase), short/sell (expecting price decrease)';
COMMENT ON COLUMN trades.status IS 'Trade status: open, partially_closed, closed, cancelled';
COMMENT ON COLUMN trades.remaining_quantity IS 'Quantity still open (for partial exits)';
COMMENT ON COLUMN trades.parent_trade_id IS 'Reference to original trade if this is a partial exit';
COMMENT ON COLUMN trades.chart_link IS 'External chart link (TradingView, broker platform, etc.)';
COMMENT ON COLUMN trades.trade_date IS 'Trade date for easier date-based queries (extracted from entry_time)';
COMMENT ON COLUMN trades.shared_by_user_id IS 'User who shared this trade (for re-sharing functionality)';

-- =====================================================
-- TABLE: trade_metrics
-- Description: Calculated trade performance metrics
-- =====================================================
CREATE TABLE trade_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID UNIQUE NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    
    -- P&L metrics
    gross_pnl DECIMAL(15,2),
    net_pnl DECIMAL(15,2),
    percent_gain DECIMAL(10,4),
    
    -- Risk metrics
    r_multiple DECIMAL(10,2),
    risk_amount DECIMAL(15,2),
    reward_amount DECIMAL(15,2),
    risk_reward_ratio DECIMAL(10,2),
    
    -- Duration
    trade_duration INTERVAL,
    trade_duration_minutes INT,
    
    -- Result
    trade_result TEXT CHECK (trade_result IN ('win', 'loss', 'breakeven')),
    
    -- Advanced metrics
    max_drawdown DECIMAL(15,2),
    max_profit DECIMAL(15,2),
    mae DECIMAL(15,2), -- Maximum Adverse Excursion
    mfe DECIMAL(15,2), -- Maximum Favorable Excursion
    
    -- Calculation timestamp
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_trade_result CHECK (
        (trade_result = 'win' AND net_pnl > 0) OR
        (trade_result = 'loss' AND net_pnl < 0) OR
        (trade_result = 'breakeven' AND net_pnl = 0)
    )
);

-- Indexes for trade_metrics
CREATE INDEX idx_trade_metrics_trade_id ON trade_metrics(trade_id);
CREATE INDEX idx_trade_metrics_user_id ON trade_metrics(user_id);
CREATE INDEX idx_trade_metrics_trade_result ON trade_metrics(user_id, trade_result);
CREATE INDEX idx_trade_metrics_net_pnl ON trade_metrics(user_id, net_pnl DESC);
CREATE INDEX idx_trade_metrics_percent_gain ON trade_metrics(user_id, percent_gain DESC);

-- Comments
COMMENT ON TABLE trade_metrics IS 'Calculated performance metrics for closed trades';
COMMENT ON COLUMN trade_metrics.gross_pnl IS 'P&L before commissions and fees';
COMMENT ON COLUMN trade_metrics.net_pnl IS 'P&L after commissions and fees';
COMMENT ON COLUMN trade_metrics.r_multiple IS 'Profit/loss as multiple of initial risk (R)';
COMMENT ON COLUMN trade_metrics.mae IS 'Maximum Adverse Excursion - worst drawdown during trade';
COMMENT ON COLUMN trade_metrics.mfe IS 'Maximum Favorable Excursion - best profit during trade';

-- =====================================================
-- TABLE: trade_images
-- Description: Trade screenshots and chart images
-- =====================================================
CREATE TABLE trade_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_name TEXT,
    image_type TEXT CHECK (image_type IN ('chart', 'screenshot', 'analysis', 'other')),
    display_order INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for trade_images
CREATE INDEX idx_trade_images_trade_id ON trade_images(trade_id, display_order);
CREATE INDEX idx_trade_images_user_id ON trade_images(user_id);

-- Comments
COMMENT ON TABLE trade_images IS 'Trade screenshots, charts, and analysis images';
COMMENT ON COLUMN trade_images.image_type IS 'Image category: chart, screenshot, analysis, other';
COMMENT ON COLUMN trade_images.display_order IS 'Order for displaying multiple images';

-- =====================================================
-- TABLE: trade_tags
-- Description: Many-to-many relationship between trades and tags
-- =====================================================
CREATE TABLE trade_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_trade_tag UNIQUE(trade_id, tag_id)
);

-- Indexes for trade_tags
CREATE INDEX idx_trade_tags_trade_id ON trade_tags(trade_id);
CREATE INDEX idx_trade_tags_tag_id ON trade_tags(tag_id);

-- Comments
COMMENT ON TABLE trade_tags IS 'Many-to-many relationship linking trades to tags';

-- =====================================================
-- TABLE: partial_exits
-- Description: Tracks partial exit transactions
-- =====================================================
CREATE TABLE partial_exits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    exit_quantity DECIMAL(15,4) NOT NULL,
    exit_price DECIMAL(15,4) NOT NULL,
    exit_time TIMESTAMPTZ NOT NULL,
    fees DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT positive_exit_quantity CHECK (exit_quantity > 0),
    CONSTRAINT positive_exit_price CHECK (exit_price > 0)
);

-- Indexes for partial_exits
CREATE INDEX idx_partial_exits_trade_id ON partial_exits(trade_id, exit_time);
CREATE INDEX idx_partial_exits_user_id ON partial_exits(user_id);

-- Comments
COMMENT ON TABLE partial_exits IS 'Tracks individual partial exit transactions for trades';
COMMENT ON COLUMN partial_exits.exit_quantity IS 'Quantity closed in this partial exit';

-- =====================================================
-- FUNCTION: Calculate trade metrics
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
BEGIN
    -- Get trade details
    SELECT * INTO v_trade
    FROM trades
    WHERE id = p_trade_id;
    
    -- Only calculate for closed trades
    IF v_trade.status != 'closed' OR v_trade.exit_price IS NULL THEN
        RETURN;
    END IF;
    
    -- Calculate gross P&L
    IF v_trade.action IN ('long', 'buy') THEN
        v_gross_pnl := (v_trade.exit_price - v_trade.entry_price) * v_trade.quantity;
    ELSE -- short/sell
        v_gross_pnl := (v_trade.entry_price - v_trade.exit_price) * v_trade.quantity;
    END IF;
    
    -- Apply contract multiplier if exists
    IF v_trade.contract_multiplier IS NOT NULL THEN
        v_gross_pnl := v_gross_pnl * v_trade.contract_multiplier;
    END IF;
    
    -- Calculate net P&L (after costs)
    v_net_pnl := v_gross_pnl - COALESCE(v_trade.commission, 0) - COALESCE(v_trade.fees, 0);
    
    -- Calculate percentage gain
    v_percent_gain := (v_net_pnl / (v_trade.entry_price * v_trade.quantity)) * 100;
    
    -- Calculate risk amount (distance to stop loss)
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

-- Comments
COMMENT ON FUNCTION calculate_trade_metrics IS 'Calculates and stores performance metrics for a closed trade';

-- =====================================================
-- Grant necessary permissions
-- =====================================================
GRANT ALL ON TABLE trades TO authenticated;
GRANT ALL ON TABLE trade_metrics TO authenticated;
GRANT ALL ON TABLE trade_images TO authenticated;
GRANT ALL ON TABLE trade_tags TO authenticated;
GRANT ALL ON TABLE partial_exits TO authenticated;
