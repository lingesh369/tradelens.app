-- Migration: Phase 12 - Missing Functions
-- Description: Ports useful helper functions from the old project that were missing in local migrations
-- Dependencies: Phase 4 (trade_images)

-- =====================================================
-- FUNCTION: Get User ID from Auth
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_id_from_auth()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id FROM public.app_users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_id_from_auth IS 'Helper to get app_user id from auth.uid()';

-- =====================================================
-- FUNCTION: Add Trade Image
-- =====================================================
CREATE OR REPLACE FUNCTION add_trade_image(
    p_trade_id UUID,
    p_user_id UUID,
    p_image_url TEXT,
    p_image_name TEXT,
    p_image_type TEXT,
    p_display_order INT
)
RETURNS UUID AS $$
DECLARE
    new_image_id UUID;
BEGIN
    -- Validate that the trade exists and belongs to the user
    IF NOT EXISTS (
        SELECT 1 FROM public.trades 
        WHERE id = p_trade_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'Trade not found or does not belong to user';
    END IF;

    -- If this is a main image, update existing main image to additional
    IF p_image_type = 'main' THEN
        UPDATE public.trade_images 
        SET image_type = 'additional',
            display_order = COALESCE((SELECT MAX(display_order) + 1 FROM public.trade_images WHERE trade_id = p_trade_id AND image_type = 'additional'), 0)
        WHERE trade_id = p_trade_id AND image_type = 'main';
    END IF;

    -- Insert the new image
    INSERT INTO public.trade_images (
        trade_id, user_id, image_url, image_name, image_type, display_order
    ) VALUES (
        p_trade_id, p_user_id, p_image_url, p_image_name, p_image_type, p_display_order
    ) RETURNING id INTO new_image_id;

    RETURN new_image_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION add_trade_image IS 'Safely adds a trade image, handling main image logic';

-- =====================================================
-- FUNCTION: Remove Trade Image
-- =====================================================
CREATE OR REPLACE FUNCTION remove_trade_image(
    p_image_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_found BOOLEAN;
BEGIN
    DELETE FROM public.trade_images 
    WHERE id = p_image_id AND user_id = p_user_id
    RETURNING TRUE INTO v_found;
    
    RETURN COALESCE(v_found, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION remove_trade_image IS 'Safely removes a trade image';
