-- Migration: Frontend Schema Compatibility
-- Description: Adds columns and aliases expected by frontend code
-- Dependencies: Phase 6 (journal tables)

-- =====================================================
-- Add missing columns to journal_images
-- =====================================================

-- Add notes column (alias for caption for backward compatibility)
ALTER TABLE journal_images 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add linked_trade_id for linking images to trades
ALTER TABLE journal_images
ADD COLUMN IF NOT EXISTS linked_trade_id UUID REFERENCES trades(id) ON DELETE SET NULL;

-- Create index for linked_trade_id
CREATE INDEX IF NOT EXISTS idx_journal_images_linked_trade 
ON journal_images(linked_trade_id);

-- Comments
COMMENT ON COLUMN journal_images.notes IS 'Notes/annotations for the image (can be used alongside caption)';
COMMENT ON COLUMN journal_images.linked_trade_id IS 'Optional link to a specific trade';

-- =====================================================
-- Sync notes and caption columns
-- =====================================================

-- Create trigger to sync notes to caption
CREATE OR REPLACE FUNCTION sync_journal_image_notes_caption()
RETURNS TRIGGER AS $$
BEGIN
    -- If notes is updated but caption is not, sync caption to notes
    IF NEW.notes IS DISTINCT FROM OLD.notes AND NEW.caption IS NOT DISTINCT FROM OLD.caption THEN
        NEW.caption := NEW.notes;
    END IF;
    
    -- If caption is updated but notes is not, sync notes to caption
    IF NEW.caption IS DISTINCT FROM OLD.caption AND NEW.notes IS NOT DISTINCT FROM OLD.notes THEN
        NEW.notes := NEW.caption;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_journal_image_notes_caption_trigger
    BEFORE UPDATE ON journal_images
    FOR EACH ROW
    EXECUTE FUNCTION sync_journal_image_notes_caption();

-- =====================================================
-- Update existing data
-- =====================================================

-- Sync existing captions to notes column
UPDATE journal_images
SET notes = caption
WHERE caption IS NOT NULL AND notes IS NULL;

-- =====================================================
-- Grant permissions
-- =====================================================

-- Ensure authenticated users can access journal_images
GRANT ALL ON TABLE journal_images TO authenticated;
