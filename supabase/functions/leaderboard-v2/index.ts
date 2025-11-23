import { handleCors } from '../_shared/cors.ts';
import { verifyAuth, createServiceClient } from '../_shared/auth.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    await verifyAuth(req);
    const supabase = createServiceClient();

    // Get all traders with public profiles
    const { data: traders, error } = await supabase
      .from('trader_profiles')
      .select(`
        user_id,
        app_users!inner (
          username,
          first_name,
          last_name,
          profile_picture_url
        )
      `)
      .eq('is_public', true);

    if (error) throw error;

    // Calculate leaderboard scores for each trader
    const leaderboardData = await Promise.all(
      (traders || []).map(async (trader) => {
        // Get followers count
        const { count: followersCount } = await supabase
          .from('community_follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', trader.user_id);

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
        let netPnL = 0;
        let profitFactor = 1;
        let totalTrades = trades?.length || 0;

        if (trades && trades.length > 0) {
          const winningTrades = trades.filter(
            (t) => t.trade_metrics?.trade_outcome === 'WIN'
          ).length;
          winRate = (winningTrades / trades.length) * 100;

          netPnL = trades.reduce(
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

        // Calculate leaderboard score
        // Formula: (Win Rate * 0.3) + (Profit Factor * 10) + (Net PnL / 1000) + (Followers * 0.1)
        const leaderboardScore =
          winRate * 0.3 +
          profitFactor * 10 +
          netPnL / 1000 +
          (followersCount || 0) * 0.1;

        return {
          user_id: trader.user_id,
          username: trader.app_users.username,
          full_name: `${trader.app_users.first_name} ${trader.app_users.last_name}`,
          profile_picture_url: trader.app_users.profile_picture_url,
          netPnL,
          winRate,
          profitFactor,
          totalTrades,
          followersCount: followersCount || 0,
          leaderboardScore,
        };
      })
    );

    // Sort by leaderboard score and assign ranks
    const sortedLeaderboard = leaderboardData
      .sort((a, b) => b.leaderboardScore - a.leaderboardScore)
      .map((trader, index) => ({
        ...trader,
        rank: index + 1,
      }));

    // Return top 100
    return successResponse(sortedLeaderboard.slice(0, 100));
  } catch (error) {
    console.error('Leaderboard error:', error);
    return errorResponse(error.message, 500);
  }
});
