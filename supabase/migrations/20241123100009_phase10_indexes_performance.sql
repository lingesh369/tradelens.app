-- Migration: Phase 10 - Indexes & Performance Optimization
-- Description: Creates additional indexes for query performance
-- Dependencies: All previous phases

-- Note: Most basic indexes were created in earlier migrations
-- This migration adds composite indexes and performance-critical indexes

-- =====================================================
-- Composite indexes for common query patterns
-- =====================================================

-- app_users: Subscription status queries with date filtering
CREATE INDEX idx_app_users_subscription_trial_expiry 
    ON app_users(subscription_status, trial_end_date) 
    WHERE subscription_status = 'trialing';

-- trades: User + date range queries (most common pattern)
CREATE INDEX idx_trades_user_entry_time 
    ON trades(user_id, entry_time DESC);

CREATE INDEX idx_trades_user_status_entry_time 
    ON trades(user_id, status, entry_time DESC);

-- trades: Account + date range queries
CREATE INDEX idx_trades_account_entry_time 
    ON trades(account_id, entry_time DESC) 
    WHERE account_id IS NOT NULL;

-- trades: Strategy + date range queries
CREATE INDEX idx_trades_strategy_entry_time 
    ON trades(strategy_id, entry_time DESC) 
    WHERE strategy_id IS NOT NULL;

-- trades: Shared trades feed (community)
CREATE INDEX idx_trades_shared_feed 
    ON trades(is_shared, shared_at DESC, user_id) 
    WHERE is_shared = true;

-- trade_metrics: User + result filtering
CREATE INDEX idx_trade_metrics_user_result_pnl 
    ON trade_metrics(user_id, trade_result, net_pnl DESC);

-- trade_comments: Trade + date for comment threads
CREATE INDEX idx_trade_comments_trade_created 
    ON trade_comments(trade_id, created_at ASC);

-- journal: User + date range (most common query)
CREATE INDEX idx_journal_user_date_range 
    ON journal(user_id, journal_date DESC);

-- notifications: Unread notifications query optimization
CREATE INDEX idx_notifications_unread_priority 
    ON notifications(user_id, priority DESC, created_at DESC) 
    WHERE is_read = false;

-- user_subscriptions: Active subscriptions expiring soon
CREATE INDEX idx_user_subscriptions_expiring 
    ON user_subscriptions(status, current_period_end) 
    WHERE status IN ('active', 'trialing');

-- payment_history: User payment history with date
CREATE INDEX idx_payment_history_user_date 
    ON payment_history(user_id, created_at DESC, status);

-- community_follows: Follower's following list
CREATE INDEX idx_community_follows_follower_created 
    ON community_follows(follower_id, created_at DESC);

-- community_follows: User's followers list
CREATE INDEX idx_community_follows_following_created 
    ON community_follows(following_id, created_at DESC);

-- trade_likes: Trade likes count optimization
CREATE INDEX idx_trade_likes_trade_created 
    ON trade_likes(trade_id, created_at DESC);

-- =====================================================
-- Partial indexes for specific use cases
-- =====================================================

-- Active accounts only
CREATE INDEX idx_accounts_user_active 
    ON accounts(user_id, name) 
    WHERE is_active = true;

-- Active strategies only
CREATE INDEX idx_strategies_user_active 
    ON strategies(user_id, name) 
    WHERE is_active = true;

-- Open trades only
CREATE INDEX idx_trades_user_open 
    ON trades(user_id, entry_time DESC) 
    WHERE status = 'open';

-- Failed payments for retry
CREATE INDEX idx_payment_history_failed 
    ON payment_history(user_id, created_at DESC) 
    WHERE status = 'failed';

-- Pending affiliate commissions
CREATE INDEX idx_affiliate_commissions_pending 
    ON affiliate_commissions(affiliate_user_id, created_at DESC) 
    WHERE status = 'pending';

-- =====================================================
-- GIN indexes for JSONB columns
-- =====================================================

-- subscription_plans: Feature and limit queries
CREATE INDEX idx_subscription_plans_features 
    ON subscription_plans USING gin(features);

CREATE INDEX idx_subscription_plans_limits 
    ON subscription_plans USING gin(limits);

-- user_settings: Settings value queries
CREATE INDEX idx_user_settings_value 
    ON user_settings USING gin(value);

-- strategies: Rules queries
CREATE INDEX idx_strategies_rules 
    ON strategies USING gin(rules);

-- notifications: Data queries
CREATE INDEX idx_notifications_data 
    ON notifications USING gin(data);

-- email_logs: Template data queries
CREATE INDEX idx_email_logs_template_data 
    ON email_logs USING gin(template_data);

-- =====================================================
-- Array indexes for tag queries
-- =====================================================

-- trades: Tag filtering (if using array instead of junction table)
-- Note: We're using trade_tags junction table, so this is optional
-- CREATE INDEX idx_trades_tags ON trades USING gin(tags);

-- journal: Tag filtering
CREATE INDEX idx_journal_tags 
    ON journal USING gin(tags);

-- notes: Tag filtering
CREATE INDEX idx_notes_tags 
    ON notes USING gin(tags);

-- =====================================================
-- Text search indexes (already created in phase 6, but documenting here)
-- =====================================================

-- notes: Full-text search (already created in phase 6)
-- CREATE INDEX idx_notes_search ON notes USING gin(
--     to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content, ''))
-- );

-- =====================================================
-- Statistics and analyze
-- =====================================================

-- Update table statistics for query planner
ANALYZE app_users;
ANALYZE trader_profiles;
ANALYZE user_settings;
ANALYZE subscription_plans;
ANALYZE user_subscriptions;
ANALYZE payment_history;
ANALYZE coupons;
ANALYZE coupon_usage;
ANALYZE accounts;
ANALYZE strategies;
ANALYZE strategy_rules;
ANALYZE tags;
ANALYZE commissions;
ANALYZE trades;
ANALYZE trade_metrics;
ANALYZE trade_images;
ANALYZE trade_tags;
ANALYZE partial_exits;
ANALYZE community_follows;
ANALYZE trade_likes;
ANALYZE trade_comments;
ANALYZE pinned_trades;
ANALYZE journal;
ANALYZE journal_images;
ANALYZE notes;
ANALYZE notifications;
ANALYZE user_push_tokens;
ANALYZE email_logs;
ANALYZE subscription_event_logs;
ANALYZE user_creation_log;
ANALYZE affiliate_commissions;

-- =====================================================
-- Performance monitoring views
-- =====================================================

-- View: Slow queries (requires pg_stat_statements extension)
-- Uncomment if pg_stat_statements is enabled
/*
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time,
    stddev_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100 -- queries taking more than 100ms on average
ORDER BY mean_exec_time DESC
LIMIT 50;
*/

-- View: Table sizes
CREATE OR REPLACE VIEW table_sizes AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- View: Index usage statistics
CREATE OR REPLACE VIEW index_usage AS
SELECT 
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;

-- View: Unused indexes (candidates for removal)
CREATE OR REPLACE VIEW unused_indexes AS
SELECT 
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND idx_scan = 0
AND indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Comments
COMMENT ON VIEW table_sizes IS 'Shows size of all tables in the database';
COMMENT ON VIEW index_usage IS 'Shows index usage statistics for performance monitoring';
COMMENT ON VIEW unused_indexes IS 'Shows indexes that have never been used (candidates for removal)';

-- =====================================================
-- Maintenance functions
-- =====================================================

-- Function: Reindex all tables
CREATE OR REPLACE FUNCTION reindex_all_tables()
RETURNS void AS $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'REINDEX TABLE ' || quote_ident(table_record.tablename);
        RAISE NOTICE 'Reindexed table: %', table_record.tablename;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION reindex_all_tables IS 'Reindexes all tables in the public schema (use during maintenance windows)';

-- Function: Update all table statistics
CREATE OR REPLACE FUNCTION analyze_all_tables()
RETURNS void AS $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'ANALYZE ' || quote_ident(table_record.tablename);
        RAISE NOTICE 'Analyzed table: %', table_record.tablename;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION analyze_all_tables IS 'Updates statistics for all tables to improve query planning';

-- =====================================================
-- Query optimization hints
-- =====================================================

-- Set default statistics target for better query planning
ALTER TABLE trades ALTER COLUMN entry_time SET STATISTICS 1000;
ALTER TABLE trades ALTER COLUMN user_id SET STATISTICS 1000;
ALTER TABLE trade_metrics ALTER COLUMN net_pnl SET STATISTICS 1000;
ALTER TABLE user_subscriptions ALTER COLUMN current_period_end SET STATISTICS 1000;

-- =====================================================
-- Connection pooling configuration (for reference)
-- =====================================================

-- These settings should be configured in Supabase dashboard or supabase/config.toml
-- Not applied here as they require superuser privileges

/*
-- Recommended settings for connection pooling:
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET min_wal_size = '1GB';
ALTER SYSTEM SET max_wal_size = '4GB';
*/
