-- Migration: 20260214000002_default_public_profiles
-- Description: Makes trader profiles public by default and auto-creates them on user signup.

-- 1. Update default value for is_public
ALTER TABLE public.trader_profiles ALTER COLUMN is_public SET DEFAULT true;

-- 2. Update existing profiles to be public (as per user request "by default should show its profile")
UPDATE public.trader_profiles SET is_public = true WHERE is_public = false;

