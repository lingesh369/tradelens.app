-- Migration: Fix journal_id References
-- Description: Updates functions to use 'id' instead of 'journal_id' for journal table
-- Dependencies: Phase 6 (journal table), access control functions

-- =====================================================
-- Fix aggregate_trade_notes_for_date function
-- =====================================================

CREATE OR REPLACE FUNCTION aggregate_trade_notes_for_date(
    target_user_id UUID,
    target_date DATE
)
RETURNS void AS $$
DECLARE
    v_journal_id UUID;
    v_aggregated_notes TEXT;
BEGIN
    -- Get journal ID for the date (using 'id' not 'journal_id')
    SELECT id INTO v_journal_id
    FROM journal
    WHERE user_id = target_user_id
    AND journal_date = target_date;
    
    -- If no journal exists, create one
    IF v_journal_id IS NULL THEN
        INSERT INTO journal (user_id, journal_date, content)
        VALUES (target_user_id, target_date, '')
        RETURNING id INTO v_journal_id;
    END IF;
    
    -- Aggregate all trade notes for this date
    SELECT STRING_AGG(
        CONCAT(
            '**', instrument, '** (', action, ') - ',
            COALESCE(notes, 'No notes')
        ),
        E'\n\n'
        ORDER BY entry_time
    ) INTO v_aggregated_notes
    FROM trades
    WHERE user_id = target_user_id
    AND trade_date = target_date
    AND notes IS NOT NULL
    AND notes != '';
    
    -- Update journal with aggregated notes
    -- Store in a custom field or append to content
    UPDATE journal
    SET content = COALESCE(content, '') || E'\n\n## Trade Notes\n' || COALESCE(v_aggregated_notes, 'No trade notes for this day'),
        updated_at = NOW()
    WHERE id = v_journal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION aggregate_trade_notes_for_date IS 'Aggregates all trade notes for a specific date into the journal entry';

-- =====================================================
-- Fix aggregate_journal_image_notes_for_date function
-- =====================================================

CREATE OR REPLACE FUNCTION aggregate_journal_image_notes_for_date(
    target_user_id UUID,
    target_date DATE
)
RETURNS void AS $$
DECLARE
    v_journal_id UUID;
    v_aggregated_notes TEXT;
BEGIN
    -- Get journal ID for the date (using 'id' not 'journal_id')
    SELECT id INTO v_journal_id
    FROM journal
    WHERE user_id = target_user_id
    AND journal_date = target_date;
    
    -- If no journal exists, create one
    IF v_journal_id IS NULL THEN
        INSERT INTO journal (user_id, journal_date, content)
        VALUES (target_user_id, target_date, '')
        RETURNING id INTO v_journal_id;
    END IF;
    
    -- Aggregate all journal image captions/notes for this date
    SELECT STRING_AGG(
        CONCAT(
            '![', COALESCE(image_name, 'Image'), '](', image_url, ')',
            E'\n',
            COALESCE(caption, 'No caption')
        ),
        E'\n\n'
        ORDER BY display_order, created_at
    ) INTO v_aggregated_notes
    FROM journal_images
    WHERE user_id = target_user_id
    AND journal_id = v_journal_id
    AND (caption IS NOT NULL AND caption != '');
    
    -- Update journal with aggregated image notes
    UPDATE journal
    SET content = COALESCE(content, '') || E'\n\n## Image Notes\n' || COALESCE(v_aggregated_notes, 'No image notes'),
        updated_at = NOW()
    WHERE id = v_journal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION aggregate_journal_image_notes_for_date IS 'Aggregates all journal image captions for a specific date into the journal entry';
