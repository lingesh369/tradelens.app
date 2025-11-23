-- Migration: Phase 2 - Subscriptions & Payments
-- Description: Creates subscription plans, user subscriptions, payment history, and coupon system
-- Dependencies: Phase 1 (app_users)

-- =====================================================
-- TABLE: subscription_plans
-- Description: Available subscription tiers and pricing
-- =====================================================
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    plan_type TEXT DEFAULT 'paid' CHECK (plan_type IN ('trial', 'paid', 'lifetime')),
    validity_days INT, -- Number of days the plan is valid for (NULL = recurring)
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    features JSONB NOT NULL DEFAULT '{}',
    limits JSONB NOT NULL DEFAULT '{"accounts": 1, "strategies": 3, "trades_per_month": 100}',
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    stripe_price_id_monthly TEXT,
    stripe_price_id_yearly TEXT,
    cashfree_plan_id_monthly TEXT,
    cashfree_plan_id_yearly TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for subscription_plans
CREATE INDEX idx_subscription_plans_is_active ON subscription_plans(is_active) WHERE is_active = true;
CREATE INDEX idx_subscription_plans_sort_order ON subscription_plans(sort_order);
CREATE UNIQUE INDEX idx_subscription_plans_default ON subscription_plans(is_default) WHERE is_default = true;

-- Comments
COMMENT ON TABLE subscription_plans IS 'Available subscription tiers with pricing and feature limits';
COMMENT ON COLUMN subscription_plans.plan_type IS 'Plan type: trial (free trial), paid (subscription), lifetime (one-time payment)';
COMMENT ON COLUMN subscription_plans.validity_days IS 'Number of days plan is valid (for trials/lifetime), NULL for recurring subscriptions';
COMMENT ON COLUMN subscription_plans.features IS 'JSONB object describing plan features (e.g., {"analytics": true, "community": true})';
COMMENT ON COLUMN subscription_plans.limits IS 'JSONB object with usage limits (e.g., {"accounts": 3, "strategies": 10})';
COMMENT ON COLUMN subscription_plans.is_default IS 'Whether this is the default plan for new users (only one can be true)';

-- =====================================================
-- TABLE: user_subscriptions
-- Description: Active user subscriptions with payment gateway info
-- =====================================================
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    status TEXT NOT NULL CHECK (status IN ('trialing', 'active', 'expired', 'cancelled', 'past_due')),
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime')),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    next_billing_date TIMESTAMPTZ, -- When the next billing will occur
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMPTZ,
    payment_gateway TEXT CHECK (payment_gateway IN ('cashfree', 'stripe', 'manual', 'trial')),
    gateway_subscription_id TEXT,
    gateway_customer_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user_subscriptions
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_period_end ON user_subscriptions(current_period_end) WHERE status IN ('active', 'trialing');
CREATE INDEX idx_user_subscriptions_gateway ON user_subscriptions(payment_gateway, gateway_subscription_id);
CREATE UNIQUE INDEX idx_user_subscriptions_active_per_user ON user_subscriptions(user_id) WHERE status IN ('active', 'trialing');

-- Comments
COMMENT ON TABLE user_subscriptions IS 'User subscription records with payment gateway integration';
COMMENT ON COLUMN user_subscriptions.status IS 'Subscription status: trialing, active, expired, cancelled, past_due';
COMMENT ON COLUMN user_subscriptions.cancel_at_period_end IS 'If true, subscription will not renew at period end';
COMMENT ON COLUMN user_subscriptions.gateway_subscription_id IS 'Subscription ID from payment gateway (Cashfree/Stripe)';

-- =====================================================
-- TABLE: payment_history
-- Description: Complete payment transaction history
-- =====================================================
CREATE TABLE payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    original_amount DECIMAL(10,2), -- Amount before discount
    discount_amount DECIMAL(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'cancelled')),
    payment_method TEXT,
    payment_gateway TEXT CHECK (payment_gateway IN ('cashfree', 'stripe', 'manual')),
    gateway_payment_id TEXT,
    gateway_order_id TEXT,
    transaction_id TEXT, -- Gateway transaction ID
    invoice_id TEXT, -- Invoice reference
    order_number TEXT, -- Order number for tracking
    description TEXT,
    coupon_code TEXT,
    provider_ref TEXT, -- Additional provider reference
    admin_notes TEXT, -- Notes from admin for manual payments
    cashfree_order_id TEXT, -- Cashfree specific
    cashfree_payment_session_id TEXT, -- Cashfree specific
    metadata JSONB DEFAULT '{}',
    paid_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for payment_history
CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX idx_payment_history_subscription_id ON payment_history(subscription_id);
CREATE INDEX idx_payment_history_status ON payment_history(status);
CREATE INDEX idx_payment_history_created_at ON payment_history(created_at DESC);
CREATE INDEX idx_payment_history_gateway ON payment_history(payment_gateway, gateway_payment_id);

-- Comments
COMMENT ON TABLE payment_history IS 'Complete audit trail of all payment transactions';
COMMENT ON COLUMN payment_history.status IS 'Payment status: pending, succeeded, failed, refunded, cancelled';
COMMENT ON COLUMN payment_history.discount_amount IS 'Amount discounted via coupon code';

-- =====================================================
-- TABLE: coupons
-- Description: Discount coupon codes for promotions
-- =====================================================
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ NOT NULL,
    usage_limit_total INT,
    usage_limit_per_user INT DEFAULT 1,
    usage_count INT DEFAULT 0,
    applicable_plans UUID[],
    currency_restriction TEXT[],
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_discount_value CHECK (
        (discount_type = 'percentage' AND discount_value > 0 AND discount_value <= 100) OR
        (discount_type = 'fixed' AND discount_value > 0)
    ),
    CONSTRAINT valid_date_range CHECK (valid_until > valid_from)
);

-- Indexes for coupons
CREATE INDEX idx_coupons_code ON coupons(UPPER(code));
CREATE INDEX idx_coupons_is_active ON coupons(is_active) WHERE is_active = true;
CREATE INDEX idx_coupons_valid_until ON coupons(valid_until);
CREATE INDEX idx_coupons_created_by ON coupons(created_by);

-- Comments
COMMENT ON TABLE coupons IS 'Discount coupon codes for promotional campaigns';
COMMENT ON COLUMN coupons.discount_type IS 'Type of discount: percentage (e.g., 20%) or fixed (e.g., $10)';
COMMENT ON COLUMN coupons.usage_limit_total IS 'Maximum total uses across all users (NULL = unlimited)';
COMMENT ON COLUMN coupons.usage_limit_per_user IS 'Maximum uses per user (default 1)';
COMMENT ON COLUMN coupons.applicable_plans IS 'Array of plan IDs this coupon applies to (NULL = all plans)';

-- =====================================================
-- TABLE: coupon_usage
-- Description: Tracks coupon redemptions
-- =====================================================
CREATE TABLE coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES payment_history(id) ON DELETE SET NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for coupon_usage
CREATE INDEX idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_user_id ON coupon_usage(user_id);
CREATE INDEX idx_coupon_usage_used_at ON coupon_usage(used_at DESC);

-- Comments
COMMENT ON TABLE coupon_usage IS 'Audit trail of coupon redemptions';
COMMENT ON COLUMN coupon_usage.discount_amount IS 'Actual discount amount applied (calculated from coupon)';

-- =====================================================
-- TABLE: subscription_event_logs
-- Description: Audit trail for subscription lifecycle events
-- =====================================================
CREATE TABLE subscription_event_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT,
    metadata JSONB DEFAULT '{}',
    performed_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for subscription_event_logs
CREATE INDEX idx_subscription_event_logs_user_id ON subscription_event_logs(user_id);
CREATE INDEX idx_subscription_event_logs_subscription_id ON subscription_event_logs(subscription_id);
CREATE INDEX idx_subscription_event_logs_event_type ON subscription_event_logs(event_type);
CREATE INDEX idx_subscription_event_logs_created_at ON subscription_event_logs(created_at DESC);

-- Comments
COMMENT ON TABLE subscription_event_logs IS 'Audit trail of all subscription lifecycle events';
COMMENT ON COLUMN subscription_event_logs.event_type IS 'Event type: created, upgraded, downgraded, cancelled, expired, renewed, etc.';
COMMENT ON COLUMN subscription_event_logs.performed_by IS 'User who performed the action (NULL for system actions)';

-- =====================================================
-- Insert subscription plans (from production database)
-- =====================================================
INSERT INTO subscription_plans (
    name, 
    display_name, 
    description, 
    plan_type, 
    validity_days, 
    price_monthly, 
    price_yearly, 
    features, 
    limits, 
    is_default, 
    sort_order
) VALUES
-- Free Trial Plan (Default)
('free', 'Free Trial', '7-day free trial with basic features', 'trial', 7, 0, 0, 
 '{"notes": true, "profile": true, "analytics": true, "community": true, "ai": false}',
 '{"accounts": 3, "strategies": 5, "trades": -1}',
 true, 1),

-- Starter Plan
('starter', 'Starter', 'Perfect for beginners starting their trading journey', 'paid', 30, 9, 84,
 '{"notes": true, "profile": true, "analytics": true, "community": true, "ai": false}',
 '{"accounts": 3, "strategies": 5, "trades": -1}',
 false, 2),

-- Pro Plan
('pro', 'Pro', 'Advanced features for serious traders', 'paid', 30, 19, 180,
 '{"notes": true, "profile": true, "analytics": true, "community": true, "ai": true}',
 '{"accounts": -1, "strategies": -1, "trades": -1}',
 false, 3);

-- =====================================================
-- Grant necessary permissions
-- =====================================================
GRANT ALL ON TABLE subscription_plans TO authenticated;
GRANT ALL ON TABLE user_subscriptions TO authenticated;
GRANT ALL ON TABLE payment_history TO authenticated;
GRANT ALL ON TABLE coupons TO authenticated;
GRANT ALL ON TABLE coupon_usage TO authenticated;
GRANT ALL ON TABLE subscription_event_logs TO authenticated;
