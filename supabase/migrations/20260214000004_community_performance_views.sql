-- Migration: 20260214000004_community_performance_views
-- Description: Creates optimized views for community feed, traders list, and leaderboard.

-- 1. Optimized Community Traders View
CREATE OR REPLACE VIEW public.community_traders_view AS
SELECT 
    tp.user_id,
    au.username,
    au.first_name,
    au.last_name,
    au.avatar_url,
    tp.bio,
    tp.total_trades,
    tp.win_rate,
    tp.total_pnl,
    (SELECT COUNT(*) FROM public.community_follows WHERE following_id = tp.user_id) AS followers_count,
    (
        SELECT sp.name 
        FROM public.user_subscriptions us
        JOIN public.subscription_plans sp ON us.plan_id = sp.id
        WHERE us.user_id = tp.user_id AND us.status = 'active'
        LIMIT 1
    ) AS subscription_badge
FROM public.trader_profiles tp
JOIN public.app_users au ON tp.user_id = au.id
WHERE tp.is_public = true;

-- 2. Optimized Leaderboard View
-- Formula: (Win Rate * 0.3) + (Net PnL / 1000) + (Followers * 0.1)
CREATE OR REPLACE VIEW public.leaderboard_view AS
WITH trader_stats AS (
    SELECT 
        tp.user_id,
        au.username,
        au.first_name,
        au.last_name,
        au.avatar_url,
        tp.win_rate,
        tp.total_pnl,
        tp.total_trades,
        (SELECT COUNT(*) FROM public.community_follows WHERE following_id = tp.user_id) AS followers_count,
        (
            SELECT sp.name 
            FROM public.user_subscriptions us
            JOIN public.subscription_plans sp ON us.plan_id = sp.id
            WHERE us.user_id = tp.user_id AND us.status = 'active'
            LIMIT 1
        ) AS subscription_badge
    FROM public.trader_profiles tp
    JOIN public.app_users au ON tp.user_id = au.id
    WHERE tp.is_public = true
)
SELECT 
    *,
    (
        (win_rate * 0.3) + 
        (total_pnl / 1000.0) + 
        (followers_count * 0.1)
    ) AS leaderboard_score
FROM trader_stats
ORDER BY leaderboard_score DESC;

-- Grant permissions
GRANT SELECT ON public.community_traders_view TO authenticated;
GRANT SELECT ON public.leaderboard_view TO authenticated;
