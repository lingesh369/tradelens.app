-- Migration: 20260214000001_safe_community_additions
-- Description: Adds missing community infrastructure (chats, messages) and helper functions.
-- This migration is safely idempotent and adds elements identified as missing in the remote environment.

-- 1. Create chats table if not exists
CREATE TABLE IF NOT EXISTS public.chats (
    chat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant1_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
    participant2_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chats_participants_different CHECK (participant1_id <> participant2_id)
);

-- 2. Create messages table if not exists
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES public.chats(chat_id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add avatar_url to app_users if it somehow doesn't exist (failsafe)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='app_users' AND column_name='avatar_url') THEN
        ALTER TABLE public.app_users ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- 4. Community Helper Functions

CREATE OR REPLACE FUNCTION get_follower_count(p_user_id UUID)
RETURNS INT AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.community_follows
        WHERE following_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_following(p_follower_id UUID, p_following_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.community_follows
        WHERE follower_id = p_follower_id
        AND following_id = p_following_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_liked_trade(p_user_id UUID, p_trade_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.trade_likes
        WHERE user_id = p_user_id
        AND trade_id = p_trade_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_trade_comment_count(p_trade_id UUID)
RETURNS INT AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.trade_comments
        WHERE trade_id = p_trade_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_trade_pinned(p_user_id UUID, p_trade_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.pinned_trades
        WHERE user_id = p_user_id
        AND trade_id = p_trade_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RLS for chats and messages (Simple starting point)
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;
CREATE POLICY "Users can view their own chats" ON public.chats
    FOR SELECT USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

DROP POLICY IF EXISTS "Users can insert their own chats" ON public.chats;
CREATE POLICY "Users can insert their own chats" ON public.chats
    FOR INSERT WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
CREATE POLICY "Users can view messages in their chats" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chats
            WHERE chat_id = messages.chat_id
            AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can insert messages in their chats" ON public.messages;
CREATE POLICY "Users can insert messages in their chats" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);
