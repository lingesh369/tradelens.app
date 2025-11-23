import { handleCors } from '../_shared/cors.ts';
import { verifyAuth, createServiceClient } from '../_shared/auth.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { user } = await verifyAuth(req);
    const { sortBy = 'recent', searchQuery = '', limit = 20, offset = 0 } = await req.json();

    const supabase = createServiceClient();

    // Get current user's app user ID
    const { data: appUser } = await supabase
      .from('app_users')
      .select('user_id')
      .eq('auth_id', user.id)
      .single();

    const currentUserId = appUser?.user_id;

    // Build query for shared trades
    let query = supabase
      .from('trades')
      .select(`
        trade_id,
        instrument,
        action,
        quantity,
        entry_price,
        exit_price,
        entry_time,
        exit_time,
        notes,
        created_at,
        user_id,
        app_users!inner (
          username,
          first_name,
          last_name,
          profile_picture_url
        ),
        accounts!inner (
          account_name
        ),
        strategies (
          strategy_name
        ),
        trade_metrics (
          net_p_and_l,
          gross_p_and_l,
          percent_gain,
          trade_outcome,
          r2r,
          trade_duration
        )
      `)
      .eq('is_shared', true);

    // Apply search filter
    if (searchQuery) {
      query = query.or(`instrument.ilike.%${searchQuery}%,notes.ilike.%${searchQuery}%`);
    }

    // Apply sorting
    switch (sortBy) {
      case 'recent':
        query = query.order('created_at', { ascending: false });
        break;
      case 'popular':
        // Will need to join with likes count
        query = query.order('created_at', { ascending: false });
        break;
      case 'top_performers':
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: trades, error } = await query;

    if (error) throw error;

    // Enrich with likes and comments count
    const enrichedTrades = await Promise.all(
      (trades || []).map(async (trade) => {
        // Get likes count
        const { count: likesCount } = await supabase
          .from('community_likes')
          .select('*', { count: 'exact', head: true })
          .eq('trade_id', trade.trade_id);

        // Get comments count
        const { count: commentsCount } = await supabase
          .from('trade_comments')
          .select('*', { count: 'exact', head: true })
          .eq('trade_id', trade.trade_id);

        // Check if current user liked this trade
        let isLikedByUser = false;
        if (currentUserId) {
          const { data: like } = await supabase
            .from('community_likes')
            .select('id')
            .eq('user_id', currentUserId)
            .eq('trade_id', trade.trade_id)
            .single();
          isLikedByUser = !!like;
        }

        return {
          ...trade,
          likes_count: likesCount || 0,
          comments_count: commentsCount || 0,
          is_liked_by_user: isLikedByUser,
        };
      })
    );

    return successResponse({ data: enrichedTrades });
  } catch (error) {
    console.error('Community feed error:', error);
    return errorResponse(error.message, 500);
  }
});
