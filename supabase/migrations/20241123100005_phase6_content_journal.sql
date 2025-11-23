-- Migration: Phase 6 - Content & Journal
-- Description: Creates journal entries, journal images, and notes
-- Dependencies: Phase 1 (app_users)

-- =====================================================
-- TABLE: journal
-- Description: Daily trading journal entries
-- =====================================================
CREATE TABLE journal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    journal_date DATE NOT NULL,
    title TEXT,
    content TEXT,
    mood TEXT CHECK (mood IN ('excellent', 'good', 'neutral', 'bad', 'terrible')),
    market_conditions TEXT,
    lessons_learned TEXT,
    goals_for_tomorrow TEXT,
    tags TEXT[],
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_journal_date UNIQUE(user_id, journal_date)
);

-- Indexes for journal
CREATE INDEX idx_journal_user_id ON journal(user_id);
CREATE INDEX idx_journal_date ON journal(user_id, journal_date DESC);
CREATE INDEX idx_journal_mood ON journal(user_id, mood);
CREATE INDEX idx_journal_is_pinned ON journal(user_id, is_pinned) WHERE is_pinned = true;

-- Comments
COMMENT ON TABLE journal IS 'Daily trading journal entries for reflection and analysis';
COMMENT ON COLUMN journal.mood IS 'Trader''s emotional state: excellent, good, neutral, bad, terrible';
COMMENT ON COLUMN journal.market_conditions IS 'Notes about market conditions on this day';
COMMENT ON COLUMN journal.lessons_learned IS 'Key lessons learned from the day''s trading';

-- =====================================================
-- TABLE: journal_images
-- Description: Images attached to journal entries
-- =====================================================
CREATE TABLE journal_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_id UUID NOT NULL REFERENCES journal(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_name TEXT,
    caption TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for journal_images
CREATE INDEX idx_journal_images_journal_id ON journal_images(journal_id, display_order);
CREATE INDEX idx_journal_images_user_id ON journal_images(user_id);

-- Comments
COMMENT ON TABLE journal_images IS 'Images attached to journal entries (charts, screenshots, etc.)';
COMMENT ON COLUMN journal_images.display_order IS 'Order for displaying multiple images';

-- =====================================================
-- TABLE: notes
-- Description: User notes and documentation
-- =====================================================
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT,
    tags TEXT[],
    is_pinned BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT non_empty_title CHECK (LENGTH(TRIM(title)) > 0)
);

-- Indexes for notes
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_category ON notes(user_id, category);
CREATE INDEX idx_notes_is_pinned ON notes(user_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_notes_is_archived ON notes(user_id, is_archived) WHERE is_archived = false;
CREATE INDEX idx_notes_created_at ON notes(user_id, created_at DESC);
CREATE INDEX idx_notes_updated_at ON notes(user_id, updated_at DESC);

-- Full-text search index for notes
CREATE INDEX idx_notes_search ON notes USING gin(
    to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content, ''))
);

-- Comments
COMMENT ON TABLE notes IS 'User notes for strategies, ideas, and documentation';
COMMENT ON COLUMN notes.category IS 'Note category (e.g., strategy, idea, lesson, reminder)';
COMMENT ON COLUMN notes.is_archived IS 'Whether note is archived (hidden from main view)';
COMMENT ON COLUMN notes.color IS 'Color code for visual organization';

-- =====================================================
-- FUNCTION: Search notes
-- =====================================================
CREATE OR REPLACE FUNCTION search_notes(
    p_user_id UUID,
    p_search_query TEXT,
    p_limit INT DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    category TEXT,
    tags TEXT[],
    is_pinned BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.title,
        n.content,
        n.category,
        n.tags,
        n.is_pinned,
        n.created_at,
        n.updated_at,
        ts_rank(
            to_tsvector('english', COALESCE(n.title, '') || ' ' || COALESCE(n.content, '')),
            plainto_tsquery('english', p_search_query)
        ) AS rank
    FROM notes n
    WHERE n.user_id = p_user_id
    AND n.is_archived = false
    AND to_tsvector('english', COALESCE(n.title, '') || ' ' || COALESCE(n.content, '')) @@ plainto_tsquery('english', p_search_query)
    ORDER BY rank DESC, n.updated_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION search_notes IS 'Full-text search across user notes with relevance ranking';

-- =====================================================
-- FUNCTION: Get journal statistics
-- =====================================================
CREATE OR REPLACE FUNCTION get_journal_stats(
    p_user_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    total_entries INT,
    entries_with_mood INT,
    mood_distribution JSONB,
    avg_content_length DECIMAL,
    most_common_tags TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INT AS total_entries,
        COUNT(j.mood)::INT AS entries_with_mood,
        jsonb_object_agg(j.mood, mood_count) FILTER (WHERE j.mood IS NOT NULL) AS mood_distribution,
        AVG(LENGTH(j.content))::DECIMAL AS avg_content_length,
        ARRAY_AGG(DISTINCT tag ORDER BY tag_count DESC) FILTER (WHERE tag IS NOT NULL) AS most_common_tags
    FROM journal j
    LEFT JOIN LATERAL (
        SELECT j.mood, COUNT(*) OVER (PARTITION BY j.mood) AS mood_count
    ) mood_counts ON true
    LEFT JOIN LATERAL UNNEST(j.tags) AS tag ON true
    LEFT JOIN LATERAL (
        SELECT COUNT(*) AS tag_count
        FROM journal j2
        WHERE j2.user_id = p_user_id
        AND tag = ANY(j2.tags)
    ) tag_counts ON true
    WHERE j.user_id = p_user_id
    AND (p_start_date IS NULL OR j.journal_date >= p_start_date)
    AND (p_end_date IS NULL OR j.journal_date <= p_end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION get_journal_stats IS 'Returns statistics about user''s journal entries';

-- =====================================================
-- Grant necessary permissions
-- =====================================================
GRANT ALL ON TABLE journal TO authenticated;
GRANT ALL ON TABLE journal_images TO authenticated;
GRANT ALL ON TABLE notes TO authenticated;
