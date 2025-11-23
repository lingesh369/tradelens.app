-- Migration: Phase 5 - Community Features
-- Description: Creates community follows, trade likes, and comments
-- Dependencies: Phase 1 (app_users), Phase 4 (trades)

-- =====================================================
-- TABLE: community_follows
-- Description: User follow relationships
-- =====================================================
CREATE TABLE community_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_follow UNIQUE(follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Indexes for community_follows
CREATE INDEX idx_community_follows_follower ON community_follows(follower_id);
CREATE INDEX idx_community_follows_following ON community_follows(following_id);
CREATE INDEX idx_community_follows_created_at ON community_follows(created_at DESC);

-- Comments
COMMENT ON TABLE community_follows IS 'User follow relationships for community features';
COMMENT ON CONSTRAINT no_self_follow ON community_follows IS 'Prevents users from following themselves';

-- =====================================================
-- TABLE: trade_likes
-- Description: Trade like/favorite records
-- =====================================================
CREATE TABLE trade_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_trade_like UNIQUE(user_id, trade_id)
);

-- Indexes for trade_likes
CREATE INDEX idx_trade_likes_user_id ON trade_likes(user_id);
CREATE INDEX idx_trade_likes_trade_id ON trade_likes(trade_id);
CREATE INDEX idx_trade_likes_created_at ON trade_likes(created_at DESC);

-- Comments
COMMENT ON TABLE trade_likes IS 'Trade likes/favorites from community members';
COMMENT ON CONSTRAINT unique_trade_like ON trade_likes IS 'Prevents duplicate likes from same user';

-- =====================================================
-- TABLE: trade_comments
-- Description: Comments on shared trades
-- =====================================================
CREATE TABLE trade_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES trade_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT non_empty_content CHECK (LENGTH(TRIM(content)) > 0)
);

-- Indexes for trade_comments
CREATE INDEX idx_trade_comments_trade_id ON trade_comments(trade_id, created_at DESC);
CREATE INDEX idx_trade_comments_user_id ON trade_comments(user_id);
CREATE INDEX idx_trade_comments_parent_comment_id ON trade_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX idx_trade_comments_created_at ON trade_comments(created_at DESC);

-- Comments
COMMENT ON TABLE trade_comments IS 'Comments on shared trades with support for nested replies';
COMMENT ON COLUMN trade_comments.parent_comment_id IS 'Reference to parent comment for threaded discussions';
COMMENT ON COLUMN trade_comments.is_edited IS 'Indicates if comment has been edited after posting';

-- =====================================================
-- TABLE: pinned_trades
-- Description: User's pinned/featured trades
-- =====================================================
CREATE TABLE pinned_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    pin_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_pinned_trade UNIQUE(user_id, trade_id)
);

-- Indexes for pinned_trades
CREATE INDEX idx_pinned_trades_user_id ON pinned_trades(user_id, pin_order);
CREATE INDEX idx_pinned_trades_trade_id ON pinned_trades(trade_id);

-- Comments
COMMENT ON TABLE pinned_trades IS 'User''s pinned/featured trades displayed prominently on profile';
COMMENT ON COLUMN pinned_trades.pin_order IS 'Display order for pinned trades (lower numbers first)';

-- =====================================================
-- FUNCTION: Get follower count
-- =====================================================
CREATE OR REPLACE FUNCTION get_follower_count(p_user_id UUID)
RETURNS INT AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM community_follows
        WHERE following_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION get_follower_count IS 'Returns the number of followers for a user';

-- =====================================================
-- FUNCTION: Get following count
-- =====================================================
CREATE OR REPLACE FUNCTION get_following_count(p_user_id UUID)
RETURNS INT AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM community_follows
        WHERE follower_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION get_following_count IS 'Returns the number of users a user is following';

-- =====================================================
-- FUNCTION: Check if user follows another user
-- =====================================================
CREATE OR REPLACE FUNCTION is_following(p_follower_id UUID, p_following_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM community_follows
        WHERE follower_id = p_follower_id
        AND following_id = p_following_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION is_following IS 'Checks if one user follows another user';

-- =====================================================
-- FUNCTION: Get trade like count
-- =====================================================
CREATE OR REPLACE FUNCTION get_trade_like_count(p_trade_id UUID)
RETURNS INT AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM trade_likes
        WHERE trade_id = p_trade_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION get_trade_like_count IS 'Returns the number of likes for a trade';

-- =====================================================
-- FUNCTION: Check if user liked a trade
-- =====================================================
CREATE OR REPLACE FUNCTION has_liked_trade(p_user_id UUID, p_trade_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM trade_likes
        WHERE user_id = p_user_id
        AND trade_id = p_trade_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION has_liked_trade IS 'Checks if a user has liked a specific trade';

-- =====================================================
-- FUNCTION: Get trade comment count
-- =====================================================
CREATE OR REPLACE FUNCTION get_trade_comment_count(p_trade_id UUID)
RETURNS INT AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM trade_comments
        WHERE trade_id = p_trade_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION get_trade_comment_count IS 'Returns the number of comments on a trade';

-- =====================================================
-- Grant necessary permissions
-- =====================================================
GRANT ALL ON TABLE community_follows TO authenticated;
GRANT ALL ON TABLE trade_likes TO authenticated;
GRANT ALL ON TABLE trade_comments TO authenticated;
GRANT ALL ON TABLE pinned_trades TO authenticated;
