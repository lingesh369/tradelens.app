-- =====================================================
-- TradeLens Main Seed File
-- This file is referenced in config.toml and runs after migrations
-- =====================================================

-- Seed data is already included in the migrations
-- Subscription plans are seeded in phase 2
-- No additional seed data needed for local development

-- Verify subscription plans exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'free') THEN
        RAISE NOTICE 'Warning: Subscription plans not found. Check migration phase 2.';
    ELSE
        RAISE NOTICE 'Seed verification: Subscription plans loaded successfully.';
    END IF;
END $$;
