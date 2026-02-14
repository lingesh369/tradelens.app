import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleCors } from '../_shared/cors.ts';
import { getOptionalUser, createServiceClient } from '../_shared/auth.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    await getOptionalUser(req);
    const supabase = createServiceClient();

    // Get top traders from the optimized leaderboard view
    const { data: leaderboard, error } = await supabase
      .from('leaderboard_view')
      .select('*')
      .limit(100);

    if (error) throw error;

    // Assign ranks and format for frontend
    const leaderboardData = (leaderboard || []).map((trader, index) => ({
      user_id: trader.user_id,
      username: trader.username,
      full_name: `${trader.first_name || ''} ${trader.last_name || ''}`.trim() || trader.username,
      avatar_url: trader.avatar_url,
      netPnL: trader.total_pnl || 0,
      winRate: trader.win_rate || 0,
      profitFactor: 1, // Default factor
      totalTrades: trader.total_trades || 0,
      followersCount: trader.followers_count || 0,
      leaderboardScore: trader.leaderboard_score || 0,
      badge: trader.subscription_badge?.includes('Pro') ? 'Pro' : (trader.subscription_badge?.includes('Starter') ? 'Starter' : null),
      rank: index + 1,
    }));

    return successResponse(leaderboardData);
  } catch (error) {
    console.error('Leaderboard error:', error);
    return errorResponse(error.message, 500);
  }
});
