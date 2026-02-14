-- Migration: 20260214000003_failsafe_data_fix
-- Description: Ensures subscription plans exist and all users have public profiles.
-- Safely handles unique constraint on is_default.

DO $$
BEGIN
    -- 1. Ensure 'free' plan exists
    IF NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'free') THEN
        -- Only set is_default=true if no other default plan exists
        IF NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE is_default = true) THEN
            INSERT INTO public.subscription_plans (name, display_name, description, plan_type, validity_days, price_monthly, price_yearly, features, limits, is_default, sort_order)
            VALUES ('free', 'Free Trial', '7-day free trial', 'trial', 7, 0, 0, '{}', '{}', true, 1);
        ELSE
            INSERT INTO public.subscription_plans (name, display_name, description, plan_type, validity_days, price_monthly, price_yearly, features, limits, is_default, sort_order)
            VALUES ('free', 'Free Trial', '7-day free trial', 'trial', 7, 0, 0, '{}', '{}', false, 1);
        END IF;
    END IF;

    -- 2. Ensure other basic plans exist
    INSERT INTO public.subscription_plans (name, display_name, description, plan_type, validity_days, price_monthly, price_yearly, features, limits, is_default, sort_order)
    VALUES 
    ('starter', 'Starter', 'Starter Plan', 'paid', 30, 9, 84, '{}', '{}', false, 2),
    ('pro', 'Pro', 'Pro Plan', 'paid', 30, 19, 180, '{}', '{}', false, 3)
    ON CONFLICT (name) DO NOTHING;

    -- 3. Ensure all app_users have a trader_profile (failsafe for handle_new_signup)
    INSERT INTO public.trader_profiles (user_id, is_public)
    SELECT id, true FROM public.app_users
    ON CONFLICT (user_id) DO UPDATE SET is_public = true;

    -- 4. Mark all trader profiles as public for community visibility
    UPDATE public.trader_profiles SET is_public = true WHERE is_public = false;
END $$;
