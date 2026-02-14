-- Migration: Security Audit Logging
-- Description: Creates comprehensive security audit logging tables and functions
-- Date: 2026-02-14

-- =====================================================
-- Security Audit Log Table
-- =====================================================
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL, -- 'auth', 'payment', 'data', 'admin', 'security'
  event_data JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,
  severity TEXT DEFAULT 'info', -- 'info', 'warning', 'error', 'critical'
  status TEXT DEFAULT 'success', -- 'success', 'failure', 'blocked'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_security_audit_user_id ON security_audit_log(user_id);
CREATE INDEX idx_security_audit_event_type ON security_audit_log(event_type);
CREATE INDEX idx_security_audit_event_category ON security_audit_log(event_category);
CREATE INDEX idx_security_audit_created_at ON security_audit_log(created_at DESC);
CREATE INDEX idx_security_audit_severity ON security_audit_log(severity);
CREATE INDEX idx_security_audit_status ON security_audit_log(status);

-- =====================================================
-- Failed Login Attempts Table
-- =====================================================
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  attempt_time TIMESTAMPTZ DEFAULT NOW(),
  failure_reason TEXT
);

CREATE INDEX idx_failed_login_email ON failed_login_attempts(email);
CREATE INDEX idx_failed_login_ip ON failed_login_attempts(ip_address);
CREATE INDEX idx_failed_login_time ON failed_login_attempts(attempt_time DESC);

-- =====================================================
-- Account Lockout Table
-- =====================================================
CREATE TABLE IF NOT EXISTS account_lockouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  locked_until TIMESTAMPTZ NOT NULL,
  reason TEXT,
  locked_by UUID REFERENCES app_users(id), -- NULL for automatic lockouts
  unlocked_at TIMESTAMPTZ,
  unlocked_by UUID REFERENCES app_users(id)
);

CREATE INDEX idx_account_lockouts_user_id ON account_lockouts(user_id);
CREATE INDEX idx_account_lockouts_email ON account_lockouts(email);
CREATE INDEX idx_account_lockouts_locked_until ON account_lockouts(locked_until);

-- =====================================================
-- Suspicious Activity Log
-- =====================================================
CREATE TABLE IF NOT EXISTS suspicious_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  description TEXT,
  risk_score INT DEFAULT 0, -- 0-100
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES app_users(id),
  reviewed_at TIMESTAMPTZ,
  action_taken TEXT
);

CREATE INDEX idx_suspicious_activity_user_id ON suspicious_activity_log(user_id);
CREATE INDEX idx_suspicious_activity_type ON suspicious_activity_log(activity_type);
CREATE INDEX idx_suspicious_activity_detected_at ON suspicious_activity_log(detected_at DESC);
CREATE INDEX idx_suspicious_activity_reviewed ON suspicious_activity_log(reviewed);
CREATE INDEX idx_suspicious_activity_risk_score ON suspicious_activity_log(risk_score DESC);

-- =====================================================
-- Function: Log Security Event
-- =====================================================
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_category TEXT,
  p_event_data JSONB DEFAULT '{}'::jsonb,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_severity TEXT DEFAULT 'info',
  p_status TEXT DEFAULT 'success'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO security_audit_log (
    user_id,
    event_type,
    event_category,
    event_data,
    ip_address,
    user_agent,
    severity,
    status
  ) VALUES (
    p_user_id,
    p_event_type,
    p_event_category,
    p_event_data,
    p_ip_address,
    p_user_agent,
    p_severity,
    p_status
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: Log Failed Login Attempt
-- =====================================================
CREATE OR REPLACE FUNCTION log_failed_login(
  p_email TEXT,
  p_ip_address INET,
  p_user_agent TEXT DEFAULT NULL,
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_attempt_count INT;
  v_user_id UUID;
BEGIN
  -- Insert failed attempt
  INSERT INTO failed_login_attempts (
    email,
    ip_address,
    user_agent,
    failure_reason
  ) VALUES (
    p_email,
    p_ip_address,
    p_user_agent,
    p_failure_reason
  );
  
  -- Count recent attempts (last 15 minutes)
  SELECT COUNT(*) INTO v_attempt_count
  FROM failed_login_attempts
  WHERE email = p_email
  AND attempt_time > NOW() - INTERVAL '15 minutes';
  
  -- If 5 or more attempts, lock the account
  IF v_attempt_count >= 5 THEN
    -- Get user_id if exists
    SELECT id INTO v_user_id
    FROM app_users
    WHERE email = p_email;
    
    -- Lock account for 30 minutes
    INSERT INTO account_lockouts (
      user_id,
      email,
      locked_until,
      reason
    ) VALUES (
      v_user_id,
      p_email,
      NOW() + INTERVAL '30 minutes',
      'Too many failed login attempts'
    );
    
    -- Log security event
    PERFORM log_security_event(
      v_user_id,
      'account_locked',
      'security',
      jsonb_build_object(
        'reason', 'failed_login_attempts',
        'attempt_count', v_attempt_count
      ),
      p_ip_address,
      p_user_agent,
      'warning',
      'blocked'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: Check if Account is Locked
-- =====================================================
CREATE OR REPLACE FUNCTION is_account_locked(p_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_locked BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM account_lockouts
    WHERE email = p_email
    AND locked_until > NOW()
    AND unlocked_at IS NULL
  ) INTO v_locked;
  
  RETURN v_locked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: Unlock Account
-- =====================================================
CREATE OR REPLACE FUNCTION unlock_account(
  p_email TEXT,
  p_unlocked_by UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE account_lockouts
  SET 
    unlocked_at = NOW(),
    unlocked_by = p_unlocked_by
  WHERE email = p_email
  AND unlocked_at IS NULL;
  
  -- Log security event
  PERFORM log_security_event(
    (SELECT id FROM app_users WHERE email = p_email),
    'account_unlocked',
    'security',
    jsonb_build_object('unlocked_by', p_unlocked_by),
    NULL,
    NULL,
    'info',
    'success'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: Log Suspicious Activity
-- =====================================================
CREATE OR REPLACE FUNCTION log_suspicious_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_description TEXT,
  p_risk_score INT DEFAULT 50,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO suspicious_activity_log (
    user_id,
    activity_type,
    description,
    risk_score,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    p_user_id,
    p_activity_type,
    p_description,
    p_risk_score,
    p_ip_address,
    p_user_agent,
    p_metadata
  ) RETURNING id INTO v_activity_id;
  
  -- Also log in security audit
  PERFORM log_security_event(
    p_user_id,
    p_activity_type,
    'security',
    jsonb_build_object(
      'description', p_description,
      'risk_score', p_risk_score,
      'metadata', p_metadata
    ),
    p_ip_address,
    p_user_agent,
    CASE 
      WHEN p_risk_score >= 80 THEN 'critical'
      WHEN p_risk_score >= 60 THEN 'error'
      WHEN p_risk_score >= 40 THEN 'warning'
      ELSE 'info'
    END,
    'success'
  );
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Trigger: Log Password Changes
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_log_password_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log password change in security audit
  PERFORM log_security_event(
    NEW.id,
    'password_changed',
    'auth',
    jsonb_build_object(
      'changed_at', NOW()
    ),
    NULL,
    NULL,
    'info',
    'success'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This trigger would need to be on auth.users table which we don't have direct access to
-- Instead, implement this in the password change edge function

-- =====================================================
-- Trigger: Log Role Changes
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_log_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.user_role != NEW.user_role THEN
    PERFORM log_security_event(
      NEW.id,
      'role_changed',
      'admin',
      jsonb_build_object(
        'old_role', OLD.user_role,
        'new_role', NEW.user_role,
        'changed_by', auth.uid()
      ),
      NULL,
      NULL,
      'warning',
      'success'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_role_change
  AFTER UPDATE OF user_role ON app_users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_role_change();

-- =====================================================
-- Trigger: Log Subscription Changes
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_log_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_security_event(
      NEW.user_id,
      'subscription_created',
      'payment',
      jsonb_build_object(
        'plan_id', NEW.plan_id,
        'status', NEW.status,
        'billing_cycle', NEW.billing_cycle
      ),
      NULL,
      NULL,
      'info',
      'success'
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM log_security_event(
      NEW.user_id,
      'subscription_status_changed',
      'payment',
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'plan_id', NEW.plan_id
      ),
      NULL,
      NULL,
      'info',
      'success'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_subscription_change
  AFTER INSERT OR UPDATE OF status ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_subscription_change();

-- =====================================================
-- RLS Policies
-- =====================================================
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_lockouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspicious_activity_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view security logs
CREATE POLICY "Admins can view security audit logs"
  ON security_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
      AND app_users.user_role = 'admin'
    )
  );

CREATE POLICY "Admins can view failed login attempts"
  ON failed_login_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
      AND app_users.user_role = 'admin'
    )
  );

CREATE POLICY "Admins can view account lockouts"
  ON account_lockouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
      AND app_users.user_role = 'admin'
    )
  );

CREATE POLICY "Admins can view suspicious activity"
  ON suspicious_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
      AND app_users.user_role = 'admin'
    )
  );

-- =====================================================
-- Grant Permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION log_security_event TO authenticated;
GRANT EXECUTE ON FUNCTION log_failed_login TO authenticated;
GRANT EXECUTE ON FUNCTION is_account_locked TO authenticated;
GRANT EXECUTE ON FUNCTION unlock_account TO authenticated;
GRANT EXECUTE ON FUNCTION log_suspicious_activity TO authenticated;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE security_audit_log IS 'Comprehensive security audit log for all security-related events';
COMMENT ON TABLE failed_login_attempts IS 'Tracks failed login attempts for account lockout and security monitoring';
COMMENT ON TABLE account_lockouts IS 'Manages account lockouts due to security concerns';
COMMENT ON TABLE suspicious_activity_log IS 'Logs suspicious activities for security review';

COMMENT ON FUNCTION log_security_event IS 'Logs a security event to the audit log';
COMMENT ON FUNCTION log_failed_login IS 'Logs a failed login attempt and locks account if threshold exceeded';
COMMENT ON FUNCTION is_account_locked IS 'Checks if an account is currently locked';
COMMENT ON FUNCTION unlock_account IS 'Unlocks a locked account';
COMMENT ON FUNCTION log_suspicious_activity IS 'Logs suspicious activity for security review';
