import { handleCors } from '../_shared/cors.ts';
import { verifyAuth, createServiceClient } from '../_shared/auth.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { user } = await verifyAuth(req);
    const { intent_data } = await req.json();

    const supabase = createServiceClient();
    const context: any = {};

    // Fetch relevant data based on intent
    if (intent_data?.intent === 'trade_analysis' || intent_data?.intent === 'strategy_review') {
      // Get recent trades
      const { data: trades } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
        .limit(20);

      context.recent_trades = trades;

      // Get user's trading statistics
      const { data: stats } = await supabase
        .from('user_trading_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      context.trading_stats = stats;

      // Get active strategies
      const { data: strategies } = await supabase
        .from('strategies')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      context.strategies = strategies;
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    context.profile = profile;

    return successResponse(context);
  } catch (error) {
    console.error('Context fetcher error:', error);
    return errorResponse(error.message, 500);
  }
});
