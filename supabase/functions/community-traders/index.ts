import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleCors } from '../_shared/cors.ts';
import { getOptionalUser, createServiceClient } from '../_shared/auth.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { user } = await getOptionalUser(req);
    const { sortBy = 'followers', searchQuery = '', limit = 20, offset = 0 } = await req.json();

    const supabase = createServiceClient();

    // Simplified current user identification
    const currentUserId = user?.id;

    // Get traders from the optimized view
    let query = supabase
      .from('community_traders_view')
      .select('*');

    // Apply search filter (now simpler as it's in the view)
    if (searchQuery) {
      query = query.or(`username.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`);
    }

    // Apply sorting (now handled by the DB)
    switch (sortBy) {
      case 'followers':
        query = query.order('followers_count', { ascending: false });
        break;
      case 'win_rate':
        query = query.order('win_rate', { ascending: false });
        break;
      case 'pnl':
        query = query.order('total_pnl', { ascending: false });
        break;
    }

    const { data: traders, error } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    // Enrich with dynamic follow status
    const enrichedTraders = await Promise.all(
      (traders || []).map(async (trader) => {
        let isFollowedByUser = false;
        if (currentUserId) {
          const { data: follow } = await supabase
            .from('community_follows')
            .select('id')
            .eq('follower_id', currentUserId)
            .eq('following_id', trader.user_id)
            .maybeSingle();
          isFollowedByUser = !!follow;
        }

        return {
          ...trader,
          is_followed_by_user: isFollowedByUser,
          trades_count: trader.total_trades,
          badge: trader.subscription_badge?.includes('Pro') ? 'Pro' : (trader.subscription_badge?.includes('Starter') ? 'Starter' : null)
        };
      })
    );

    return successResponse({ data: enrichedTraders });
  } catch (error) {
    console.error('Community traders error:', error);
    return errorResponse(error.message, 500);
  }
});
