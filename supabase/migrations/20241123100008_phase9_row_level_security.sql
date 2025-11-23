-- Migration: Phase 9 - Row Level Security (RLS)
-- Description: Enables RLS and creates security policies for all tables
-- Dependencies: All previous phases

-- =====================================================
-- Enable RLS on all tables
-- =====================================================
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trader_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_event_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE partial_exits ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinned_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_creation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- app_users policies
-- =====================================================
CREATE POLICY "Users can view their own profile"
    ON app_users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON app_users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can view public profiles"
    ON app_users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM trader_profiles
            WHERE trader_profiles.user_id = app_users.id
            AND trader_profiles.is_public = true
        )
    );

-- =====================================================
-- trader_profiles policies
-- =====================================================
CREATE POLICY "Users can view their own trader profile"
    ON trader_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own trader profile"
    ON trader_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view public trader profiles"
    ON trader_profiles FOR SELECT
    USING (is_public = true);

-- =====================================================
-- user_settings policies
-- =====================================================
CREATE POLICY "Users can manage their own settings"
    ON user_settings FOR ALL
    USING (auth.uid() = user_id);

-- =====================================================
-- subscription_plans policies
-- =====================================================
CREATE POLICY "Anyone can view active subscription plans"
    ON subscription_plans FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans"
    ON subscription_plans FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.id = auth.uid()
            AND app_users.user_role = 'admin'
        )
    );

-- =====================================================
-- user_subscriptions policies
-- =====================================================
CREATE POLICY "Users can view their own subscriptions"
    ON user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
    ON user_subscriptions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.id = auth.uid()
            AND app_users.user_role = 'admin'
        )
    );

CREATE POLICY "Admins can manage subscriptions"
    ON user_subscriptions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.id = auth.uid()
            AND app_users.user_role = 'admin'
        )
    );

-- =====================================================
-- payment_history policies
-- =====================================================
CREATE POLICY "Users can view their own payment history"
    ON payment_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment history"
    ON payment_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.id = auth.uid()
            AND app_users.user_role = 'admin'
        )
    );

-- =====================================================
-- coupons policies
-- =====================================================
CREATE POLICY "Anyone can view active coupons"
    ON coupons FOR SELECT
    USING (is_active = true AND valid_until > NOW());

CREATE POLICY "Admins can manage coupons"
    ON coupons FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.id = auth.uid()
            AND app_users.user_role = 'admin'
        )
    );

-- =====================================================
-- coupon_usage policies
-- =====================================================
CREATE POLICY "Users can view their own coupon usage"
    ON coupon_usage FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own coupon usage"
    ON coupon_usage FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- subscription_event_logs policies
-- =====================================================
CREATE POLICY "Users can view their own subscription events"
    ON subscription_event_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscription events"
    ON subscription_event_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.id = auth.uid()
            AND app_users.user_role = 'admin'
        )
    );

-- =====================================================
-- accounts policies
-- =====================================================
CREATE POLICY "Users can manage their own accounts"
    ON accounts FOR ALL
    USING (auth.uid() = user_id);

-- =====================================================
-- strategies policies
-- =====================================================
CREATE POLICY "Users can manage their own strategies"
    ON strategies FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view public strategies"
    ON strategies FOR SELECT
    USING (is_public = true);

-- =====================================================
-- strategy_rules policies
-- =====================================================
CREATE POLICY "Users can manage their own strategy rules"
    ON strategy_rules FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view public strategy rules"
    ON strategy_rules FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM strategies
            WHERE strategies.id = strategy_rules.strategy_id
            AND strategies.is_public = true
        )
    );

-- =====================================================
-- tags policies
-- =====================================================
CREATE POLICY "Users can manage their own tags"
    ON tags FOR ALL
    USING (auth.uid() = user_id);

-- =====================================================
-- commissions policies
-- =====================================================
CREATE POLICY "Users can manage their own commissions"
    ON commissions FOR ALL
    USING (auth.uid() = user_id);

-- =====================================================
-- trades policies
-- =====================================================
CREATE POLICY "Users can manage their own trades"
    ON trades FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared trades"
    ON trades FOR SELECT
    USING (is_shared = true);

-- =====================================================
-- trade_metrics policies
-- =====================================================
CREATE POLICY "Users can view their own trade metrics"
    ON trade_metrics FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view metrics for shared trades"
    ON trade_metrics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM trades
            WHERE trades.id = trade_metrics.trade_id
            AND trades.is_shared = true
        )
    );

-- =====================================================
-- trade_images policies
-- =====================================================
CREATE POLICY "Users can manage their own trade images"
    ON trade_images FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view images for shared trades"
    ON trade_images FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM trades
            WHERE trades.id = trade_images.trade_id
            AND trades.is_shared = true
        )
    );

-- =====================================================
-- trade_tags policies
-- =====================================================
CREATE POLICY "Users can manage their own trade tags"
    ON trade_tags FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM trades
            WHERE trades.id = trade_tags.trade_id
            AND trades.user_id = auth.uid()
        )
    );

-- =====================================================
-- partial_exits policies
-- =====================================================
CREATE POLICY "Users can manage their own partial exits"
    ON partial_exits FOR ALL
    USING (auth.uid() = user_id);

-- =====================================================
-- community_follows policies
-- =====================================================
CREATE POLICY "Users can view all follows"
    ON community_follows FOR SELECT
    USING (true);

CREATE POLICY "Users can manage their own follows"
    ON community_follows FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows"
    ON community_follows FOR DELETE
    USING (auth.uid() = follower_id);

-- =====================================================
-- trade_likes policies
-- =====================================================
CREATE POLICY "Users can view all trade likes"
    ON trade_likes FOR SELECT
    USING (true);

CREATE POLICY "Users can manage their own likes"
    ON trade_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
    ON trade_likes FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- trade_comments policies
-- =====================================================
CREATE POLICY "Users can view comments on shared trades"
    ON trade_comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM trades
            WHERE trades.id = trade_comments.trade_id
            AND (trades.is_shared = true OR trades.user_id = auth.uid())
        )
    );

CREATE POLICY "Users can create comments on shared trades"
    ON trade_comments FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM trades
            WHERE trades.id = trade_comments.trade_id
            AND trades.is_shared = true
        )
    );

CREATE POLICY "Users can update their own comments"
    ON trade_comments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
    ON trade_comments FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- pinned_trades policies
-- =====================================================
CREATE POLICY "Users can manage their own pinned trades"
    ON pinned_trades FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view others' pinned trades"
    ON pinned_trades FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM trader_profiles
            WHERE trader_profiles.user_id = pinned_trades.user_id
            AND trader_profiles.is_public = true
        )
    );

-- =====================================================
-- journal policies
-- =====================================================
CREATE POLICY "Users can manage their own journal entries"
    ON journal FOR ALL
    USING (auth.uid() = user_id);

-- =====================================================
-- journal_images policies
-- =====================================================
CREATE POLICY "Users can manage their own journal images"
    ON journal_images FOR ALL
    USING (auth.uid() = user_id);

-- =====================================================
-- notes policies
-- =====================================================
CREATE POLICY "Users can manage their own notes"
    ON notes FOR ALL
    USING (auth.uid() = user_id);

-- =====================================================
-- notifications policies
-- =====================================================
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- user_push_tokens policies
-- =====================================================
CREATE POLICY "Users can manage their own push tokens"
    ON user_push_tokens FOR ALL
    USING (auth.uid() = user_id);

-- =====================================================
-- email_logs policies
-- =====================================================
CREATE POLICY "Users can view their own email logs"
    ON email_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all email logs"
    ON email_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.id = auth.uid()
            AND app_users.user_role = 'admin'
        )
    );

-- =====================================================
-- user_creation_log policies
-- =====================================================
CREATE POLICY "Admins can view user creation logs"
    ON user_creation_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.id = auth.uid()
            AND app_users.user_role = 'admin'
        )
    );

-- =====================================================
-- affiliate_commissions policies
-- =====================================================
CREATE POLICY "Users can view their own affiliate commissions"
    ON affiliate_commissions FOR SELECT
    USING (auth.uid() = affiliate_user_id);

CREATE POLICY "Admins can manage affiliate commissions"
    ON affiliate_commissions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.id = auth.uid()
            AND app_users.user_role = 'admin'
        )
    );

-- =====================================================
-- Helper function: Check if user is admin
-- =====================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM app_users
        WHERE id = auth.uid()
        AND user_role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION is_admin IS 'Returns true if the current user is an admin';

-- =====================================================
-- Helper function: Check if user owns record
-- =====================================================
CREATE OR REPLACE FUNCTION user_owns_record(record_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() = record_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION user_owns_record IS 'Returns true if the current user owns the record';
