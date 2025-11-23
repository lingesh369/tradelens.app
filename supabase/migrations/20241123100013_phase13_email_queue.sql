-- Migration: Phase 13 - Email Queue
-- Description: Adds email_queue table for background email processing
-- Dependencies: Phase 7 (notifications_system)

-- =====================================================
-- TABLE: email_queue
-- Description: Queue for background email sending
-- =====================================================
CREATE TABLE email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    email_type TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    email_data JSONB DEFAULT '{}'::jsonb NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3
);

-- Indexes for email_queue
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_created_at ON email_queue(created_at);
CREATE INDEX idx_email_queue_user_id ON email_queue(user_id);

-- Comments
COMMENT ON TABLE email_queue IS 'Queue for background email sending';
COMMENT ON COLUMN email_queue.status IS 'Status: pending, processing, sent, failed';

-- Grant permissions
GRANT ALL ON TABLE email_queue TO authenticated;
GRANT ALL ON TABLE email_queue TO service_role;
