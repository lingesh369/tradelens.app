-- Migration: Monitoring and Logging Tables
-- Description: Creates tables for function monitoring, rate limiting, and error logging
-- Dependencies: Phase 1 (app_users table must exist)

-- =====================================================
-- TABLE: function_logs
-- =====================================================
CREATE TABLE IF NOT EXISTS function_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    function_name TEXT NOT NULL,
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    duration_ms INTEGER NOT NULL,
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    metadata JSONB,
    called_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_function_logs_function_name ON function_logs(function_name);
CREATE INDEX idx_function_logs_user_id ON function_logs(user_id);
CREATE INDEX idx_function_logs_called_at ON function_logs(called_at DESC);
CREATE INDEX idx_function_logs_success ON function_logs(success);

COMMENT ON TABLE function_logs IS 'Logs all edge function calls for monitoring and analytics';

-- =====================================================
-- TABLE: error_logs
-- =====================================================
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    function_name TEXT NOT NULL,
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    context JSONB,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_error_logs_function_name ON error_logs(function_name);
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX idx_error_logs_occurred_at ON error_logs(occurred_at DESC);

COMMENT ON TABLE error_logs IS 'Logs all errors from edge functions for debugging';

-- =====================================================
-- TABLE: rate_limit_logs
-- =====================================================
CREATE TABLE IF NOT EXISTS rate_limit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    ip_address TEXT,
    exceeded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rate_limit_logs_user_id ON rate_limit_logs(user_id);
CREATE INDEX idx_rate_limit_logs_endpoint ON rate_limit_logs(endpoint);
CREATE INDEX idx_rate_limit_logs_exceeded_at ON rate_limit_logs(exceeded_at DESC);

COMMENT ON TABLE rate_limit_logs IS 'Logs rate limit violations for security monitoring';

-- =====================================================
-- FUNCTION: Clean up old logs (retention policy)
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
    -- Delete function logs older than 30 days
    DELETE FROM function_logs WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Delete error logs older than 90 days
    DELETE FROM error_logs WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Delete rate limit logs older than 7 days
    DELETE FROM rate_limit_logs WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_logs IS 'Cleans up old monitoring logs based on retention policy';

-- =====================================================
-- VIEW: function_performance_summary
-- =====================================================
CREATE OR REPLACE VIEW function_performance_summary AS
SELECT 
    function_name,
    COUNT(*) as total_calls,
    COUNT(*) FILTER (WHERE success = true) as successful_calls,
    COUNT(*) FILTER (WHERE success = false) as failed_calls,
    ROUND(AVG(duration_ms)::numeric, 2) as avg_duration_ms,
    MAX(duration_ms) as max_duration_ms,
    MIN(duration_ms) as min_duration_ms,
    ROUND((COUNT(*) FILTER (WHERE success = true)::numeric / COUNT(*)::numeric * 100), 2) as success_rate
FROM function_logs
WHERE called_at > NOW() - INTERVAL '24 hours'
GROUP BY function_name
ORDER BY total_calls DESC;

COMMENT ON VIEW function_performance_summary IS 'Summary of function performance metrics for the last 24 hours';

-- =====================================================
-- VIEW: user_rate_limit_violations
-- =====================================================
CREATE OR REPLACE VIEW user_rate_limit_violations AS
SELECT 
    u.username,
    u.email,
    r.endpoint,
    COUNT(*) as violation_count,
    MAX(r.exceeded_at) as last_violation
FROM rate_limit_logs r
JOIN app_users u ON r.user_id = u.id
WHERE r.exceeded_at > NOW() - INTERVAL '24 hours'
GROUP BY u.username, u.email, r.endpoint
ORDER BY violation_count DESC;

COMMENT ON VIEW user_rate_limit_violations IS 'Users with rate limit violations in the last 24 hours';
