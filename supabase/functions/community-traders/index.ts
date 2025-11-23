import { handleCors } from '../_shared/cors.ts';
import { verifyAuth, createServiceClient } from '../_shared/auth.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { user } = await verifyAuth(req);
    const { sortBy = 'followers', searchQuery = '', limit = 20, offset = 0 } = await req.json();

    const supabase = createServiceClient();

    // Get current user's app user ID
    const { data: appUser } = await supabase
      .from('app_users')
      .select('user_id')
      .eq('auth_id', user.id)
      .single();

    const currentUserId = appUser?.user_id;

    // Get traders with public profiles
    let query = supabase
      .from('trader_profiles')
      .select(`
        user_id,
        bio,
        app_users!inner (
          username,
          first_name,
          last_name,
          profile_picture_url
        )
      `)
      .eq('is_public', true);

    // Apply search filter
    if (searchQuery) {
      query = query.or(`bio.ilike.%${searchQuery}%`);
    }

    const { data: traders, error } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    // Enrich with stats
    const enrichedTraders = await Promise.all(
      (traders || []).map(async (trader) => {
        // Get followers count
        const { count: followersCount } = await supabase
          .from('community_follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', trader.user_id);

        // Check if current user follows this trader
        let isFollowedByUser = false;
        if (currentUserId) {
          const { data: follow } = await supabase
            .from('community_follows')
            .select('id')
            .eq('follower_id', currentUserId)
            .eq('following_id', trader.user_id)
            .single();
          isFollowedByUser = !!follow;
        }

        // Get trading stats from shared trades
        const { data: trades } = await supabase
          .from('trades')
          .select(`
            trade_id,
            trade_metrics!inner (
              net_p_and_l,
              trade_outcome
            )
          `)
          .eq('user_id', trader.user_id)
          .eq('is_shared', true);

        let winRate = 0;
        let totalPnL = 0;
        let profitFactor = 1;
        let tradesCount = trades?.length || 0;

        if (trades && trades.length > 0) {
          const winningTrades = trades.filter(
            (t) => t.trade_metrics?.trade_outcome === 'WIN'
          ).length;
          winRate = (winningTrades / trades.length) * 100;

          totalPnL = trades.reduce(
            (sum, t) => sum + (t.trade_metrics?.net_p_and_l || 0),
            0
          );

          const profitableTrades = trades.filter(
            (t) => (t.trade_metrics?.net_p_and_l || 0) > 0
          );
          const losingTrades = trades.filter(
            (t) => (t.trade_metrics?.net_p_and_l || 0) < 0
          );

          const totalProfit = profitableTrades.reduce(
            (sum, t) => sum + (t.trade_metrics?.net_p_and_l || 0),
            0
          );
          const totalLoss = Math.abs(
            losingTrades.reduce(
              (sum, t) => sum + (t.trade_metrics?.net_p_and_l || 0),
              0
            )
          );

          profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 1;
        }

        // Get subscription badge
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select(`subscription_plans!inner(name)`)
          .eq('user_id', trader.user_id)
          .eq('status', 'active')
          .single();

        let badge = null;
        const planName = subscription?.subscription_plans?.name;
        if (planName === 'Pro Plan') badge = 'Pro';
        else if (planName === 'Starter Plan') badge = 'Starter';

        return {
          user_id: trader.user_id,
          username: trader.app_users.username,
          first_name: trader.app_users.first_name,
          last_name: trader.app_users.last_name,
          profile_picture_url: trader.app_users.profile_picture_url,
          bio: trader.bio,
          followers_count: followersCount || 0,
          win_rate: winRate,
          total_pnl: totalPnL,
          profit_factor: profitFactor,
          trades_count: tradesCount,
          badge,
          is_followed_by_user: isFollowedByUser,
        };
      })
    );

    // Apply sorting
    let sortedTraders = enrichedTraders;
    switch (sortBy) {
      case 'followers':
        sortedTraders.sort((a, b) => b.followers_count - a.followers_count);
        break;
      case 'win_rate':
        sortedTraders.sort((a, b) => b.win_rate - a.win_rate);
        break;
      case 'pnl':
        sortedTraders.sort((a, b) => b.total_pnl - a.total_pnl);
        break;
      default:
        sortedTraders.sort((a, b) => b.followers_count - a.followers_count);
    }

    return successResponse({ data: sortedTraders });
  } catch (error) {
    console.error('Community traders error:', error);
    return errorResponse(error.message, 500);
  }
});
