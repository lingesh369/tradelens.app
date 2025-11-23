-- Migration: Phase 11 - Views & Helper Functions
-- Description: Creates useful views and analytics helper functions
-- Dependencies: All previous phases

-- =====================================================
-- VIEW: trades_with_images
-- Description: Denormalized view of trades with their images
-- =====================================================
CREATE OR REPLACE VIEW trades_with_images AS
SELECT 
    t.*,
    COALESCE(
        json_agg(
            json_build_object(
                'id', ti.id,
                'image_url', ti.image_url,
                'image_name', ti.image_name,
                'image_type', ti.image_type,
                'display_order', ti.display_order,
                'notes', ti.notes
            ) ORDER BY ti.display_order
        ) FILTER (WHERE ti.id IS NOT NULL),
        '[]'::json
    ) AS images
FROM trades t
LEFT JOIN trade_images ti ON t.id = ti.trade_id
GROUP BY t.id;

-- Comments
COMMENT ON VIEW trades_with_images IS 'Trades with their associated images as JSON array';

-- =====================================================
-- VIEW: active_subscriptions
-- Description: Currently active user subscriptions with plan details
-- =====================================================
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
    us.id AS subscription_id,
    us.user_id,
    au.email,
    au.username,
    sp.name AS plan_name,
    sp.display_name AS plan_display_name,
    us.status,
    us.billing_cycle,
    us.current_period_start,
    us.current_period_end,
    us.payment_gateway,
    sp.features,
    sp.limits,
    CASE 
        WHEN us.current_period_end < NOW() THEN 'expired'
        WHEN us.current_period_end < NOW() + INTERVAL '3 days' THEN 'expiring_soon'
        ELSE 'active'
    END AS subscription_health
FROM user_subscriptions us
JOIN app_users au ON us.user_id = au.id
JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.status IN ('active', 'trialing');

-- Comments
COMMENT ON VIEW active_subscriptions IS 'Active subscriptions with user and plan details';

-- =====================================================
-- VIEW: user_trade_summary
-- Description: Summary statistics for each user's trades
-- =====================================================
CREATE OR REPLACE VIEW user_trade_summary AS
SELECT 
    t.user_id,
    COUNT(*) AS total_trades,
    COUNT(*) FILTER (WHERE t.status = 'open') AS open_trades,
    COUNT(*) FILTER (WHERE t.status = 'closed') AS closed_trades,
    COUNT(*) FILTER (WHERE tm.trade_result = 'win') AS winning_trades,
    COUNT(*) FILTER (WHERE tm.trade_result = 'loss') AS losing_trades,
    COUNT(*) FILTER (WHERE tm.trade_result = 'breakeven') AS breakeven_trades,
    ROUND(
        (COUNT(*) FILTER (WHERE tm.trade_result = 'win')::DECIMAL / 
        NULLIF(COUNT(*) FILTER (WHERE t.status = 'closed'), 0)) * 100, 
        2
    ) AS win_rate,
    SUM(tm.net_pnl) AS total_pnl,
    AVG(tm.net_pnl) AS avg_pnl,
    MAX(tm.net_pnl) AS best_trade,
    MIN(tm.net_pnl) AS worst_trade,
    AVG(tm.net_pnl) FILTER (WHERE tm.trade_result = 'win') AS avg_win,
    AVG(tm.net_pnl) FILTER (WHERE tm.trade_result = 'loss') AS avg_loss,
    AVG(tm.trade_duration_minutes) AS avg_trade_duration_minutes
FROM trades t
LEFT JOIN trade_metrics tm ON t.id = tm.trade_id
GROUP BY t.user_id;

-- Comments
COMMENT ON VIEW user_trade_summary IS 'Aggregated trading statistics per user';

-- =====================================================
-- VIEW: community_feed
-- Description: Shared trades feed for community page
-- =====================================================
CREATE OR REPLACE VIEW community_feed AS
SELECT 
    t.id AS trade_id,
    t.user_id,
    au.username,
    au.avatar_url,
    tp.bio,
    t.instrument,
    t.action,
    t.entry_price,
    t.exit_price,
    t.entry_time,
    t.exit_time,
    t.status,
    t.main_image,
    t.notes,
    t.shared_at,
    tm.net_pnl,
    tm.percent_gain,
    tm.trade_result,
    (SELECT COUNT(*) FROM trade_likes WHERE trade_id = t.id) AS like_count,
    (SELECT COUNT(*) FROM trade_comments WHERE trade_id = t.id) AS comment_count
FROM trades t
JOIN app_users au ON t.user_id = au.id
LEFT JOIN trader_profiles tp ON t.user_id = tp.user_id
LEFT JOIN trade_metrics tm ON t.id = tm.trade_id
WHERE t.is_shared = true
ORDER BY t.shared_at DESC;

-- Comments
COMMENT ON VIEW community_feed IS 'Shared trades feed with user info and engagement metrics';

-- =====================================================
-- VIEW: expiring_trials
-- Description: Trials expiring in the next 7 days
-- =====================================================
CREATE OR REPLACE VIEW expiring_trials AS
SELECT 
    au.id AS user_id,
    au.email,
    au.username,
    au.trial_end_date,
    au.created_at AS signup_date,
    EXTRACT(DAY FROM au.trial_end_date - NOW()) AS days_remaining,
    (SELECT COUNT(*) FROM trades WHERE user_id = au.id) AS trade_count
FROM app_users au
WHERE au.subscription_status = 'trialing'
AND au.trial_end_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY au.trial_end_date ASC;

-- Comments
COMMENT ON VIEW expiring_trials IS 'Users with trials expiring in the next 7 days';

-- =====================================================
-- FUNCTION: Get user analytics
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_analytics(
    p_user_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL,
    p_account_id UUID DEFAULT NULL,
    p_strategy_id UUID DEFAULT NULL
)
RETURNS TABLE (
    total_trades BIGINT,
    open_trades BIGINT,
    closed_trades BIGINT,
    winning_trades BIGINT,
    losing_trades BIGINT,
    win_rate DECIMAL,
    total_pnl DECIMAL,
    avg_pnl DECIMAL,
    best_trade DECIMAL,
    worst_trade DECIMAL,
    avg_win DECIMAL,
    avg_loss DECIMAL,
    profit_factor DECIMAL,
    avg_trade_duration_minutes DECIMAL,
    total_commission DECIMAL,
    total_fees DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT AS total_trades,
        COUNT(*) FILTER (WHERE t.status = 'open')::BIGINT AS open_trades,
        COUNT(*) FILTER (WHERE t.status = 'closed')::BIGINT AS closed_trades,
        COUNT(*) FILTER (WHERE tm.trade_result = 'win')::BIGINT AS winning_trades,
        COUNT(*) FILTER (WHERE tm.trade_result = 'loss')::BIGINT AS losing_trades,
        ROUND(
            (COUNT(*) FILTER (WHERE tm.trade_result = 'win')::DECIMAL / 
            NULLIF(COUNT(*) FILTER (WHERE t.status = 'closed'), 0)) * 100, 
            2
        ) AS win_rate,
        COALESCE(SUM(tm.net_pnl), 0)::DECIMAL AS total_pnl,
        AVG(tm.net_pnl)::DECIMAL AS avg_pnl,
        MAX(tm.net_pnl)::DECIMAL AS best_trade,
        MIN(tm.net_pnl)::DECIMAL AS worst_trade,
        AVG(tm.net_pnl) FILTER (WHERE tm.trade_result = 'win')::DECIMAL AS avg_win,
        AVG(tm.net_pnl) FILTER (WHERE tm.trade_result = 'loss')::DECIMAL AS avg_loss,
        CASE 
            WHEN ABS(SUM(tm.net_pnl) FILTER (WHERE tm.trade_result = 'loss')) > 0 THEN
                ABS(SUM(tm.net_pnl) FILTER (WHERE tm.trade_result = 'win') / 
                    SUM(tm.net_pnl) FILTER (WHERE tm.trade_result = 'loss'))
            ELSE NULL
        END::DECIMAL AS profit_factor,
        AVG(tm.trade_duration_minutes)::DECIMAL AS avg_trade_duration_minutes,
        SUM(t.commission)::DECIMAL AS total_commission,
        SUM(t.fees)::DECIMAL AS total_fees
    FROM trades t
    LEFT JOIN trade_metrics tm ON t.id = tm.trade_id
    WHERE t.user_id = p_user_id
    AND (p_start_date IS NULL OR t.entry_time >= p_start_date)
    AND (p_end_date IS NULL OR t.entry_time <= p_end_date)
    AND (p_account_id IS NULL OR t.account_id = p_account_id)
    AND (p_strategy_id IS NULL OR t.strategy_id = p_strategy_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION get_user_analytics IS 'Returns comprehensive trading analytics for a user with optional filters';

-- =====================================================
-- FUNCTION: Get daily P&L series
-- =====================================================
CREATE OR REPLACE FUNCTION get_daily_pnl_series(
    p_user_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    trade_date DATE,
    daily_pnl DECIMAL,
    trade_count BIGINT,
    winning_trades BIGINT,
    losing_trades BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.entry_time::DATE AS trade_date,
        COALESCE(SUM(tm.net_pnl), 0)::DECIMAL AS daily_pnl,
        COUNT(*)::BIGINT AS trade_count,
        COUNT(*) FILTER (WHERE tm.trade_result = 'win')::BIGINT AS winning_trades,
        COUNT(*) FILTER (WHERE tm.trade_result = 'loss')::BIGINT AS losing_trades
    FROM trades t
    LEFT JOIN trade_metrics tm ON t.id = tm.trade_id
    WHERE t.user_id = p_user_id
    AND t.entry_time::DATE BETWEEN p_start_date AND p_end_date
    AND t.status = 'closed'
    GROUP BY t.entry_time::DATE
    ORDER BY t.entry_time::DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION get_daily_pnl_series IS 'Returns daily P&L time series for charting';

-- =====================================================
-- FUNCTION: Get top performing strategies
-- =====================================================
CREATE OR REPLACE FUNCTION get_top_strategies(
    p_user_id UUID,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    strategy_id UUID,
    strategy_name TEXT,
    total_trades INT,
    win_rate DECIMAL,
    total_pnl DECIMAL,
    avg_pnl DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.total_trades,
        s.win_rate,
        s.total_pnl,
        CASE WHEN s.total_trades > 0 THEN s.total_pnl / s.total_trades ELSE 0 END AS avg_pnl
    FROM strategies s
    WHERE s.user_id = p_user_id
    AND s.total_trades > 0
    ORDER BY s.total_pnl DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION get_top_strategies IS 'Returns top performing strategies by total P&L';

-- =====================================================
-- FUNCTION: Get trade distribution by market type
-- =====================================================
CREATE OR REPLACE FUNCTION get_market_distribution(p_user_id UUID)
RETURNS TABLE (
    market_type TEXT,
    trade_count BIGINT,
    total_pnl DECIMAL,
    win_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.market_type,
        COUNT(*)::BIGINT AS trade_count,
        COALESCE(SUM(tm.net_pnl), 0)::DECIMAL AS total_pnl,
        ROUND(
            (COUNT(*) FILTER (WHERE tm.trade_result = 'win')::DECIMAL / 
            NULLIF(COUNT(*) FILTER (WHERE t.status = 'closed'), 0)) * 100, 
            2
        ) AS win_rate
    FROM trades t
    LEFT JOIN trade_metrics tm ON t.id = tm.trade_id
    WHERE t.user_id = p_user_id
    AND t.market_type IS NOT NULL
    GROUP BY t.market_type
    ORDER BY trade_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION get_market_distribution IS 'Returns trade distribution and performance by market type';

-- =====================================================
-- FUNCTION: Get affiliate dashboard stats
-- =====================================================
CREATE OR REPLACE FUNCTION get_affiliate_stats(p_user_id UUID)
RETURNS TABLE (
    total_referrals BIGINT,
    active_referrals BIGINT,
    total_commissions DECIMAL,
    pending_commissions DECIMAL,
    paid_commissions DECIMAL,
    conversion_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT au.id)::BIGINT AS total_referrals,
        COUNT(DISTINCT au.id) FILTER (WHERE au.subscription_status = 'active')::BIGINT AS active_referrals,
        COALESCE(SUM(ac.commission_amount), 0)::DECIMAL AS total_commissions,
        COALESCE(SUM(ac.commission_amount) FILTER (WHERE ac.status = 'pending'), 0)::DECIMAL AS pending_commissions,
        COALESCE(SUM(ac.commission_amount) FILTER (WHERE ac.status = 'paid'), 0)::DECIMAL AS paid_commissions,
        ROUND(
            (COUNT(DISTINCT au.id) FILTER (WHERE au.subscription_status = 'active')::DECIMAL / 
            NULLIF(COUNT(DISTINCT au.id), 0)) * 100, 
            2
        ) AS conversion_rate
    FROM app_users au_affiliate
    LEFT JOIN app_users au ON au.referred_by = au_affiliate.affiliate_code
    LEFT JOIN affiliate_commissions ac ON ac.referred_user_id = au.id
    WHERE au_affiliate.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION get_affiliate_stats IS 'Returns affiliate dashboard statistics';

-- =====================================================
-- FUNCTION: Get admin dashboard metrics
-- =====================================================
CREATE OR REPLACE FUNCTION get_admin_dashboard_metrics()
RETURNS TABLE (
    total_users BIGINT,
    active_users BIGINT,
    trial_users BIGINT,
    total_trades BIGINT,
    total_revenue DECIMAL,
    mrr DECIMAL,
    churn_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM app_users)::BIGINT AS total_users,
        (SELECT COUNT(*) FROM app_users WHERE subscription_status = 'active')::BIGINT AS active_users,
        (SELECT COUNT(*) FROM app_users WHERE subscription_status = 'trialing')::BIGINT AS trial_users,
        (SELECT COUNT(*) FROM trades)::BIGINT AS total_trades,
        (SELECT COALESCE(SUM(amount), 0) FROM payment_history WHERE status = 'succeeded')::DECIMAL AS total_revenue,
        (
            SELECT COALESCE(SUM(sp.price_monthly), 0)
            FROM user_subscriptions us
            JOIN subscription_plans sp ON us.plan_id = sp.id
            WHERE us.status = 'active'
            AND us.billing_cycle = 'monthly'
        )::DECIMAL AS mrr,
        0::DECIMAL AS churn_rate; -- Placeholder, requires historical data
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION get_admin_dashboard_metrics IS 'Returns key metrics for admin dashboard';

-- =====================================================
-- Grant permissions on views
-- =====================================================
GRANT SELECT ON trades_with_images TO authenticated;
GRANT SELECT ON active_subscriptions TO authenticated;
GRANT SELECT ON user_trade_summary TO authenticated;
GRANT SELECT ON community_feed TO authenticated;
GRANT SELECT ON expiring_trials TO authenticated;
GRANT SELECT ON table_sizes TO authenticated;
GRANT SELECT ON index_usage TO authenticated;
GRANT SELECT ON unused_indexes TO authenticated;

-- =====================================================
-- Final setup complete message
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'TradeLens Database Setup Complete!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'All 11 migration phases have been applied:';
    RAISE NOTICE '  ✓ Phase 1: Core Authentication & Users';
    RAISE NOTICE '  ✓ Phase 2: Subscriptions & Payments';
    RAISE NOTICE '  ✓ Phase 3: Trading Core';
    RAISE NOTICE '  ✓ Phase 4: Trades & Metrics';
    RAISE NOTICE '  ✓ Phase 5: Community Features';
    RAISE NOTICE '  ✓ Phase 6: Content & Journal';
    RAISE NOTICE '  ✓ Phase 7: Notifications & System';
    RAISE NOTICE '  ✓ Phase 8: Database Functions & Triggers';
    RAISE NOTICE '  ✓ Phase 9: Row Level Security';
    RAISE NOTICE '  ✓ Phase 10: Indexes & Performance';
    RAISE NOTICE '  ✓ Phase 11: Views & Helper Functions';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Test with sample data';
    RAISE NOTICE '  2. Deploy edge functions';
    RAISE NOTICE '  3. Update frontend code';
    RAISE NOTICE '  4. Configure storage buckets';
    RAISE NOTICE '==============================================';
END $$;
