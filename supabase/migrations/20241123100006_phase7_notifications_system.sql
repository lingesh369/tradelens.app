-- Migration: Phase 7 - Notifications & System
-- Description: Creates notifications, push tokens, email logs, and system tables
-- Dependencies: Phase 1 (app_users)

-- =====================================================
-- TABLE: notifications
-- Description: User notifications for all events
-- =====================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    action_type TEXT CHECK (action_type IN ('navigate', 'external_link', 'none')),
    action_url TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read, created_at DESC) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON notifications(user_id, type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_priority ON notifications(user_id, priority, created_at DESC) WHERE is_read = false;

-- Comments
COMMENT ON TABLE notifications IS 'User notifications for all system events';
COMMENT ON COLUMN notifications.type IS 'Notification type (e.g., trade_comment, subscription_expiring, payment_success)';
COMMENT ON COLUMN notifications.action_type IS 'Action when clicked: navigate (in-app), external_link, none';
COMMENT ON COLUMN notifications.data IS 'Additional data for the notification (trade_id, comment_id, etc.)';
COMMENT ON COLUMN notifications.priority IS 'Notification priority: low, normal, high, urgent';

-- =====================================================
-- TABLE: user_push_tokens
-- Description: Push notification device tokens
-- =====================================================
CREATE TABLE user_push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
    device_info JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_token UNIQUE(user_id, token)
);

-- Indexes for user_push_tokens
CREATE INDEX idx_user_push_tokens_user_id ON user_push_tokens(user_id);
CREATE INDEX idx_user_push_tokens_platform ON user_push_tokens(platform);
CREATE INDEX idx_user_push_tokens_is_active ON user_push_tokens(user_id, is_active) WHERE is_active = true;

-- Comments
COMMENT ON TABLE user_push_tokens IS 'Device tokens for push notifications';
COMMENT ON COLUMN user_push_tokens.platform IS 'Device platform: web (PWA), ios, android';
COMMENT ON COLUMN user_push_tokens.device_info IS 'Additional device information (browser, OS version, etc.)';

-- =====================================================
-- TABLE: email_logs
-- Description: Email delivery tracking and status
-- =====================================================
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    email_type TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    subject TEXT,
    status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'spam')),
    provider TEXT DEFAULT 'brevo',
    provider_message_id TEXT,
    template_id TEXT,
    template_data JSONB DEFAULT '{}',
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for email_logs
CREATE INDEX idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_recipient_email ON email_logs(recipient_email);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at DESC);
CREATE INDEX idx_email_logs_provider_message_id ON email_logs(provider, provider_message_id);

-- Comments
COMMENT ON TABLE email_logs IS 'Complete audit trail of all email communications';
COMMENT ON COLUMN email_logs.email_type IS 'Email type (welcome, trial_reminder, payment_success, etc.)';
COMMENT ON COLUMN email_logs.status IS 'Email delivery status: queued, sent, delivered, opened, clicked, bounced, failed, spam';
COMMENT ON COLUMN email_logs.provider IS 'Email service provider (brevo, sendgrid, etc.)';

-- =====================================================
-- TABLE: user_creation_log
-- Description: Tracks user signup and profile creation
-- =====================================================
CREATE TABLE user_creation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    auth_user_id UUID,
    email TEXT NOT NULL,
    signup_method TEXT CHECK (signup_method IN ('email', 'google', 'github', 'apple')),
    signup_source TEXT,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    profile_created BOOLEAN DEFAULT false,
    profile_creation_attempts INT DEFAULT 0,
    profile_creation_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user_creation_log
CREATE INDEX idx_user_creation_log_user_id ON user_creation_log(user_id);
CREATE INDEX idx_user_creation_log_email ON user_creation_log(email);
CREATE INDEX idx_user_creation_log_signup_method ON user_creation_log(signup_method);
CREATE INDEX idx_user_creation_log_created_at ON user_creation_log(created_at DESC);
CREATE INDEX idx_user_creation_log_profile_created ON user_creation_log(profile_created) WHERE profile_created = false;

-- Comments
COMMENT ON TABLE user_creation_log IS 'Audit trail of user signups and profile creation attempts';
COMMENT ON COLUMN user_creation_log.signup_method IS 'Authentication method used: email, google, github, apple';
COMMENT ON COLUMN user_creation_log.profile_creation_attempts IS 'Number of attempts to create profile (for retry tracking)';

-- =====================================================
-- TABLE: affiliate_commissions
-- Description: Affiliate referral commission tracking
-- =====================================================
CREATE TABLE affiliate_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES payment_history(id) ON DELETE SET NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    commission_percentage DECIMAL(5,2) NOT NULL,
    payment_amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for affiliate_commissions
CREATE INDEX idx_affiliate_commissions_affiliate_user_id ON affiliate_commissions(affiliate_user_id);
CREATE INDEX idx_affiliate_commissions_referred_user_id ON affiliate_commissions(referred_user_id);
CREATE INDEX idx_affiliate_commissions_status ON affiliate_commissions(status);
CREATE INDEX idx_affiliate_commissions_created_at ON affiliate_commissions(created_at DESC);

-- Comments
COMMENT ON TABLE affiliate_commissions IS 'Commission tracking for affiliate referrals';
COMMENT ON COLUMN affiliate_commissions.status IS 'Commission status: pending, approved, paid, cancelled';

-- =====================================================
-- FUNCTION: Get unread notification count
-- =====================================================
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INT AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM notifications
        WHERE user_id = p_user_id
        AND is_read = false
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION get_unread_notification_count IS 'Returns count of unread, non-expired notifications for a user';

-- =====================================================
-- FUNCTION: Mark notifications as read
-- =====================================================
CREATE OR REPLACE FUNCTION mark_notifications_read(
    p_user_id UUID,
    p_notification_ids UUID[] DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
    v_updated_count INT;
BEGIN
    IF p_notification_ids IS NULL THEN
        -- Mark all unread notifications as read
        UPDATE notifications
        SET is_read = true, read_at = NOW()
        WHERE user_id = p_user_id
        AND is_read = false;
    ELSE
        -- Mark specific notifications as read
        UPDATE notifications
        SET is_read = true, read_at = NOW()
        WHERE user_id = p_user_id
        AND id = ANY(p_notification_ids)
        AND is_read = false;
    END IF;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION mark_notifications_read IS 'Marks notifications as read, either all or specific IDs';

-- =====================================================
-- FUNCTION: Create notification
-- =====================================================
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT DEFAULT NULL,
    p_action_type TEXT DEFAULT 'none',
    p_action_url TEXT DEFAULT NULL,
    p_data JSONB DEFAULT '{}',
    p_priority TEXT DEFAULT 'normal'
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id, type, title, message, action_type, action_url, data, priority
    ) VALUES (
        p_user_id, p_type, p_title, p_message, p_action_type, p_action_url, p_data, p_priority
    )
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION create_notification IS 'Creates a new notification for a user';

-- =====================================================
-- FUNCTION: Clean up old notifications
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_old_notifications(p_days_old INT DEFAULT 90)
RETURNS INT AS $$
DECLARE
    v_deleted_count INT;
BEGIN
    DELETE FROM notifications
    WHERE created_at < NOW() - (p_days_old || ' days')::INTERVAL
    AND is_read = true;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION cleanup_old_notifications IS 'Deletes read notifications older than specified days (default 90)';

-- =====================================================
-- Grant necessary permissions
-- =====================================================
GRANT ALL ON TABLE notifications TO authenticated;
GRANT ALL ON TABLE user_push_tokens TO authenticated;
GRANT ALL ON TABLE email_logs TO authenticated;
GRANT ALL ON TABLE user_creation_log TO authenticated;
GRANT ALL ON TABLE affiliate_commissions TO authenticated;
