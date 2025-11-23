-- Migration: Phase 3 - Trading Core
-- Description: Creates accounts, strategies, tags, and commission structures
-- Dependencies: Phase 1 (app_users)

-- =====================================================
-- TABLE: accounts
-- Description: Trading accounts linked to brokers
-- =====================================================
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    broker TEXT,
    account_type TEXT CHECK (account_type IN ('live', 'demo', 'paper')),
    initial_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    profit_loss DECIMAL(15,2) GENERATED ALWAYS AS (current_balance - initial_balance) STORED, -- Calculated P&L
    currency TEXT DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_account_name UNIQUE(user_id, name),
    CONSTRAINT positive_initial_balance CHECK (initial_balance >= 0)
);

-- Indexes for accounts
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_is_active ON accounts(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_accounts_broker ON accounts(broker);

-- Comments
COMMENT ON TABLE accounts IS 'Trading accounts with balance tracking';
COMMENT ON COLUMN accounts.account_type IS 'Account type: live (real money), demo (broker demo), paper (simulated)';
COMMENT ON COLUMN accounts.current_balance IS 'Current account balance, updated by trade P&L';
COMMENT ON COLUMN accounts.profit_loss IS 'Calculated profit/loss (current_balance - initial_balance)';

-- =====================================================
-- TABLE: strategies
-- Description: Trading strategies with performance tracking
-- =====================================================
CREATE TABLE strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    rules JSONB DEFAULT '[]',
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    total_trades INT DEFAULT 0,
    winning_trades INT DEFAULT 0,
    losing_trades INT DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    total_pnl DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_strategy_name UNIQUE(user_id, name)
);

-- Indexes for strategies
CREATE INDEX idx_strategies_user_id ON strategies(user_id);
CREATE INDEX idx_strategies_is_active ON strategies(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_strategies_is_public ON strategies(is_public) WHERE is_public = true;
CREATE INDEX idx_strategies_win_rate ON strategies(win_rate DESC) WHERE is_public = true;

-- Comments
COMMENT ON TABLE strategies IS 'Trading strategies with rules and performance metrics';
COMMENT ON COLUMN strategies.rules IS 'JSONB array of strategy rules (e.g., [{"type": "entry", "condition": "RSI < 30"}])';
COMMENT ON COLUMN strategies.is_public IS 'Whether this strategy is visible in community';
COMMENT ON COLUMN strategies.win_rate IS 'Cached win rate percentage, updated by triggers';

-- =====================================================
-- TABLE: strategy_rules
-- Description: Detailed strategy rule definitions
-- =====================================================
CREATE TABLE strategy_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('entry', 'exit', 'risk_management', 'position_sizing', 'general')),
    rule_title TEXT NOT NULL,
    rule_description TEXT,
    rule_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for strategy_rules
CREATE INDEX idx_strategy_rules_strategy_id ON strategy_rules(strategy_id, rule_order);
CREATE INDEX idx_strategy_rules_user_id ON strategy_rules(user_id);
CREATE INDEX idx_strategy_rules_rule_type ON strategy_rules(rule_type);

-- Comments
COMMENT ON TABLE strategy_rules IS 'Detailed rule definitions for trading strategies';
COMMENT ON COLUMN strategy_rules.rule_type IS 'Rule category: entry, exit, risk_management, position_sizing, general';
COMMENT ON COLUMN strategy_rules.rule_order IS 'Display order for rules within a strategy';

-- =====================================================
-- TABLE: tags
-- Description: User-defined tags for categorizing trades
-- =====================================================
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    tag_type TEXT CHECK (tag_type IN ('trade', 'mistake', 'setup', 'custom')),
    color TEXT,
    description TEXT,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_tag_name UNIQUE(user_id, name)
);

-- Indexes for tags
CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_tags_tag_type ON tags(user_id, tag_type);
CREATE INDEX idx_tags_usage_count ON tags(user_id, usage_count DESC);

-- Comments
COMMENT ON TABLE tags IS 'User-defined tags for categorizing and filtering trades';
COMMENT ON COLUMN tags.tag_type IS 'Tag category: trade (general), mistake (errors), setup (entry patterns), custom';
COMMENT ON COLUMN tags.usage_count IS 'Number of times this tag has been used, updated by triggers';

-- =====================================================
-- TABLE: commissions
-- Description: Commission structures per account/broker
-- =====================================================
CREATE TABLE commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    broker TEXT,
    market_type TEXT CHECK (market_type IN ('stocks', 'forex', 'crypto', 'futures', 'options', 'commodities')),
    commission_type TEXT NOT NULL CHECK (commission_type IN ('per_trade', 'per_share', 'percentage', 'tiered')),
    commission_value DECIMAL(10,4) NOT NULL,
    minimum_commission DECIMAL(10,2),
    maximum_commission DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT positive_commission CHECK (commission_value >= 0)
);

-- Indexes for commissions
CREATE INDEX idx_commissions_user_id ON commissions(user_id);
CREATE INDEX idx_commissions_account_id ON commissions(account_id);
CREATE INDEX idx_commissions_market_type ON commissions(market_type);

-- Comments
COMMENT ON TABLE commissions IS 'Commission structures for calculating trade costs';
COMMENT ON COLUMN commissions.commission_type IS 'How commission is calculated: per_trade (flat fee), per_share, percentage (of trade value), tiered';
COMMENT ON COLUMN commissions.commission_value IS 'Commission amount/rate based on commission_type';

-- =====================================================
-- FUNCTION: Check if user has reached plan limits
-- =====================================================
CREATE OR REPLACE FUNCTION check_plan_limit(
    p_user_id UUID,
    p_limit_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_plan_limit INT;
    v_current_count INT;
    v_subscription_status TEXT;
BEGIN
    -- Get user's subscription status
    SELECT subscription_status INTO v_subscription_status
    FROM app_users
    WHERE id = p_user_id;
    
    -- If user is not active or trialing, deny
    IF v_subscription_status NOT IN ('active', 'trialing') THEN
        RETURN false;
    END IF;
    
    -- Get plan limit
    SELECT (sp.limits->>p_limit_type)::INT INTO v_plan_limit
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id
    AND us.status IN ('active', 'trialing')
    ORDER BY us.created_at DESC
    LIMIT 1;
    
    -- If limit is -1, it means unlimited
    IF v_plan_limit = -1 THEN
        RETURN true;
    END IF;
    
    -- Count current usage based on limit type
    IF p_limit_type = 'accounts' THEN
        SELECT COUNT(*) INTO v_current_count
        FROM accounts
        WHERE user_id = p_user_id AND is_active = true;
    ELSIF p_limit_type = 'strategies' THEN
        SELECT COUNT(*) INTO v_current_count
        FROM strategies
        WHERE user_id = p_user_id AND is_active = true;
    ELSE
        RETURN true; -- Unknown limit type, allow
    END IF;
    
    -- Check if under limit
    RETURN v_current_count < v_plan_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION check_plan_limit IS 'Checks if user has reached their subscription plan limit for accounts or strategies';

-- =====================================================
-- FUNCTION: Get user's current subscription plan
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_plan(p_user_id UUID)
RETURNS TABLE (
    plan_id UUID,
    plan_name TEXT,
    status TEXT,
    limits JSONB,
    features JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id,
        sp.name,
        us.status,
        sp.limits,
        sp.features
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id
    AND us.status IN ('active', 'trialing')
    ORDER BY us.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION get_user_plan IS 'Returns the user''s current active subscription plan with limits and features';

-- =====================================================
-- Grant necessary permissions
-- =====================================================
GRANT ALL ON TABLE accounts TO authenticated;
GRANT ALL ON TABLE strategies TO authenticated;
GRANT ALL ON TABLE strategy_rules TO authenticated;
GRANT ALL ON TABLE tags TO authenticated;
GRANT ALL ON TABLE commissions TO authenticated;
