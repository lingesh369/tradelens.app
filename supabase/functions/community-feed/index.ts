import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleCors } from '../_shared/cors.ts';
import { getOptionalUser, createServiceClient } from '../_shared/auth.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { user } = await getOptionalUser(req);
    const { sortBy = 'recent', searchQuery = '', userId = null, limit = 20, offset = 0 } = await req.json();

    const supabase = createServiceClient();

    // Simplified current user identification
    const currentUserId = user?.id;

    // Build query using the optimized view
    let query = supabase
      .from('community_feed')
      .select('*');

    // Apply search filter (now handled via the view columns)
    if (searchQuery) {
      query = query.or(`instrument.ilike.%${searchQuery}%,notes.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`);
    }

    // Apply user filter
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Apply sorting
    switch (sortBy) {
      case 'recent':
        query = query.order('shared_at', { ascending: false });
        break;
      case 'popular':
        query = query.order('like_count', { ascending: false });
        break;
      case 'top_performers':
        query = query.order('percent_gain', { ascending: false });
        break;
      default:
        query = query.order('shared_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: feed, error } = await query;

    if (error) throw error;

    // Enrich with current user like status
    const enrichedFeed = await Promise.all(
      (feed || []).map(async (trade) => {
        let isLikedByUser = false;
        if (currentUserId) {
          const { data: like } = await supabase
            .from('trade_likes')
            .select('id')
            .eq('user_id', currentUserId)
            .eq('trade_id', trade.trade_id)
            .maybeSingle();
          isLikedByUser = !!like;
        }

        return {
          ...trade,
          likes_count: trade.like_count || 0,
          comments_count: trade.comment_count || 0,
          is_liked_by_user: isLikedByUser,
          app_users: {
              username: trade.username,
              avatar_url: trade.avatar_url,
              bio: trade.bio
          }
        };
      })
    );

    return successResponse({ data: enrichedFeed });
  } catch (error) {
    console.error('Community feed error:', error);
    return errorResponse(error.message, 500);
  }
});
