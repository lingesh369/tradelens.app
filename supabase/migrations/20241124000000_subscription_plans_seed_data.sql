-- Migration: Subscription Plans Seed Data
-- Description: Inserts default subscription plans with proper limits and features
-- Following industry standards for SaaS trading journal applications

-- Clear existing plans (if any)
TRUNCATE TABLE subscription_plans CASCADE;

-- =====================================================
-- Free Trial Plan (Default)
-- =====================================================
INSERT INTO subscription_plans (
    name,
    display_name,
    description,
    plan_type,
    validity_days,
    price_monthly,
    price_yearly,
    currency,
    features,
    limits,
    is_active,
    is_default,
    sort_order
) VALUES (
    'Free Trial',
    'Free Trial',
    'Try TradeLens free for 7 days with basic features',
    'trial',
    7,
    0.00,
    0.00,
    'USD',
    '{
        "notes": true,
        "profile": true,
        "analytics": true,
        "community": true,
        "ai": false,
        "csv_import": true,
        "advanced_analytics": false,
        "broker_sync": false,
        "trade_replay": false,
        "priority_support": false,
        "custom_reports": false,
        "api_access": false
    }'::jsonb,
    '{
        "accounts": 2,
        "strategies": 3,
        "trades": -1,
        "journal_entries": 20,
        "notes": 50
    }'::jsonb,
    true,
    true,
    1
);

-- =====================================================
-- Starter Plan
-- =====================================================
INSERT INTO subscription_plans (
    name,
    display_name,
    description,
    plan_type,
    validity_days,
    price_monthly,
    price_yearly,
    currency,
    features,
    limits,
    is_active,
    is_default,
    sort_order
) VALUES (
    'Starter Plan',
    'Starter',
    'Perfect for individual traders getting serious about their trading',
    'paid',
    NULL, -- Recurring subscription
    9.00,
    84.00, -- ~30% discount on yearly
    'USD',
    '{
        "notes": true,
        "profile": true,
        "analytics": true,
        "community": true,
        "ai": true,
        "csv_import": true,
        "advanced_analytics": true,
        "broker_sync": false,
        "trade_replay": false,
        "priority_support": false,
        "custom_reports": false,
        "api_access": false,
        "data_storage_gb": 5
    }'::jsonb,
    '{
        "accounts": 5,
        "strategies": 10,
        "trades": -1,
        "journal_entries": -1,
        "notes": -1
    }'::jsonb,
    true,
    false,
    2
);

-- =====================================================
-- Pro Plan
-- =====================================================
INSERT INTO subscription_plans (
    name,
    display_name,
    description,
    plan_type,
    validity_days,
    price_monthly,
    price_yearly,
    currency,
    features,
    limits,
    is_active,
    is_default,
    sort_order
) VALUES (
    'Pro Plan',
    'Pro',
    'For professional traders who need unlimited access and advanced features',
    'paid',
    NULL, -- Recurring subscription
    19.00,
    180.00, -- ~21% discount on yearly
    'USD',
    '{
        "notes": true,
        "profile": true,
        "analytics": true,
        "community": true,
        "ai": true,
        "csv_import": true,
        "advanced_analytics": true,
        "broker_sync": true,
        "trade_replay": true,
        "priority_support": true,
        "custom_reports": true,
        "api_access": true,
        "data_storage_gb": 50,
        "white_label": false
    }'::jsonb,
    '{
        "accounts": -1,
        "strategies": -1,
        "trades": -1,
        "journal_entries": -1,
        "notes": -1
    }'::jsonb,
    true,
    false,
    3
);

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE subscription_plans IS 'Subscription plans with industry-standard limits and features';

-- Note: -1 in limits means unlimited
-- Feature flags follow SaaS best practices:
-- - Free Trial: Limited features to encourage upgrade
-- - Starter: Good for individual traders, some limits
-- - Pro: Unlimited everything, all features unlocked
