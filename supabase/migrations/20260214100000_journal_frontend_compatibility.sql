-- Migration: Journal Frontend Compatibility
-- Description: Adds missing columns to journal table for frontend compatibility
-- Dependencies: Phase 6 (journal table)

-- =====================================================
-- Add missing columns to journal table
-- =====================================================

-- Add notes column (alias for content for backward compatibility)
ALTER TABLE journal 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add metrics columns that frontend expects
ALTER TABLE journal
ADD COLUMN IF NOT EXISTS net_pl DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS num_trades INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS win_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit_factor DECIMAL(10,2) DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_profitable_pl DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_losing_pl DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS winning_trades INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS losing_trades INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_fees DECIMAL(15,2) DEFAULT 0;

-- Add aggregated notes columns
ALTER TABLE journal
ADD COLUMN IF NOT EXISTS all_trades_notes TEXT,
ADD COLUMN IF NOT EXISTS all_journal_images_notes TEXT;

-- Add image captions as JSONB for storing image metadata
ALTER TABLE journal
ADD COLUMN IF NOT EXISTS image_captions JSONB DEFAULT '{}'::jsonb;

-- Add trades executed array (for tracking which trades are included)
ALTER TABLE journal
ADD COLUMN IF NOT EXISTS trades_executed UUID[];

-- =====================================================
-- Create trigger to sync notes and content columns
-- =====================================================

CREATE OR REPLACE FUNCTION sync_journal_notes_content()
RETURNS TRIGGER AS $$
BEGIN
    -- If notes is updated but content is not, sync content to notes
    IF NEW.notes IS DISTINCT FROM OLD.notes AND NEW.content IS NOT DISTINCT FROM OLD.content THEN
        NEW.content := NEW.notes;
    END IF;
    
    -- If content is updated but notes is not, sync notes to content
    IF NEW.content IS DISTINCT FROM OLD.content AND NEW.notes IS NOT DISTINCT FROM OLD.notes THEN
        NEW.notes := NEW.content;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_journal_notes_content_trigger
    BEFORE UPDATE ON journal
    FOR EACH ROW
    EXECUTE FUNCTION sync_journal_notes_content();

-- =====================================================
-- Sync existing data
-- =====================================================

-- Sync existing content to notes column
UPDATE journal
SET notes = content
WHERE content IS NOT NULL AND notes IS NULL;

-- =====================================================
-- Add journal_date to journal_images for easier querying
-- =====================================================

ALTER TABLE journal_images
ADD COLUMN IF NOT EXISTS journal_date DATE;

-- Create index for journal_date on journal_images
CREATE INDEX IF NOT EXISTS idx_journal_images_journal_date 
ON journal_images(user_id, journal_date);

-- Populate journal_date from journal table
UPDATE journal_images ji
SET journal_date = j.journal_date
FROM journal j
WHERE ji.journal_id = j.id
AND ji.journal_date IS NULL;

-- =====================================================
-- Create function to auto-populate journal_date on insert
-- =====================================================

CREATE OR REPLACE FUNCTION set_journal_image_date()
RETURNS TRIGGER AS $$
BEGIN
    -- If journal_date is not set, get it from the journal table
    IF NEW.journal_date IS NULL AND NEW.journal_id IS NOT NULL THEN
        SELECT journal_date INTO NEW.journal_date
        FROM journal
        WHERE id = NEW.journal_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_journal_image_date_trigger
    BEFORE INSERT OR UPDATE ON journal_images
    FOR EACH ROW
    EXECUTE FUNCTION set_journal_image_date();

-- =====================================================
-- Add comments for documentation
-- =====================================================

COMMENT ON COLUMN journal.notes IS 'Journal notes (synced with content for backward compatibility)';
COMMENT ON COLUMN journal.net_pl IS 'Net profit/loss for the day';
COMMENT ON COLUMN journal.num_trades IS 'Number of trades executed on this day';
COMMENT ON COLUMN journal.win_rate IS 'Win rate percentage for the day';
COMMENT ON COLUMN journal.profit_factor IS 'Profit factor for the day';
COMMENT ON COLUMN journal.total_profitable_pl IS 'Total profit from winning trades';
COMMENT ON COLUMN journal.total_losing_pl IS 'Total loss from losing trades';
COMMENT ON COLUMN journal.winning_trades IS 'Number of winning trades';
COMMENT ON COLUMN journal.losing_trades IS 'Number of losing trades';
COMMENT ON COLUMN journal.total_fees IS 'Total fees and commissions for the day';
COMMENT ON COLUMN journal.all_trades_notes IS 'Aggregated notes from all trades for this day';
COMMENT ON COLUMN journal.all_journal_images_notes IS 'Aggregated notes from all journal images for this day';
COMMENT ON COLUMN journal.image_captions IS 'JSONB object storing image captions by image ID';
COMMENT ON COLUMN journal.trades_executed IS 'Array of trade IDs executed on this day';
COMMENT ON COLUMN journal_images.journal_date IS 'Date of the journal entry (denormalized for easier querying)';

-- =====================================================
-- Create view for backward compatibility with old schema
-- =====================================================

CREATE OR REPLACE VIEW journal_with_legacy_fields AS
SELECT 
    id as journal_id,  -- Alias id as journal_id for old code
    id,                -- Keep id for new code
    user_id,
    journal_date,
    notes,
    content,
    net_pl,
    num_trades,
    win_rate,
    profit_factor,
    total_profitable_pl,
    total_losing_pl,
    winning_trades,
    losing_trades,
    total_fees,
    image_captions,
    all_trades_notes,
    all_journal_images_notes,
    trades_executed,
    title,
    mood,
    market_conditions,
    lessons_learned,
    goals_for_tomorrow,
    tags,
    is_pinned,
    created_at,
    updated_at
FROM journal;

COMMENT ON VIEW journal_with_legacy_fields IS 'View providing both id and journal_id for backward compatibility';

-- =====================================================
-- Grant permissions
-- =====================================================

GRANT ALL ON TABLE journal TO authenticated;
GRANT SELECT ON journal_with_legacy_fields TO authenticated;
