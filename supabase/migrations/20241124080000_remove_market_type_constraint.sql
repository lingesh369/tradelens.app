-- Migration: Remove Market Type Constraint
-- Description: Removes the CHECK constraint on market_type to allow any value (matching old schema)
-- Date: November 24, 2024

-- =====================================================
-- Remove market_type CHECK constraint from trades table
-- =====================================================

-- Drop the existing constraint
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_market_type_check;

-- Add comment explaining the change
COMMENT ON COLUMN trades.market_type IS 'Market type (no constraint - accepts any value for backward compatibility)';

-- Note: The old schema had no constraint on market_type, allowing any string value.
-- This migration removes the constraint to match the old behavior and prevent insertion errors.
