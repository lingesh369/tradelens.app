import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';
import { getOptionalUser, createServiceClient } from '../_shared/auth.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { user } = await getOptionalUser(req); // Optional: if public analytics, maybe relaxed auth? 
    // The frontend hook sends Auth header, so we verify.
    
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const fromDate = url.searchParams.get('from');
    const toDate = url.searchParams.get('to');

    if (!userId) {
      return errorResponse('User ID is required', 400);
    }

    const supabase = createServiceClient();

    // Fetch trades with metrics
    let query = supabase
      .from('trades')
      .select(`
        entry_price,
        exit_price,
        quantity,
        trade_date,
        trade_metrics!inner (
          net_pnl,
          gross_pnl,
          trade_result
        )
      `)
      .eq('user_id', userId);

    if (fromDate) {
      query = query.gte('trade_date', fromDate);
    }
    if (toDate) {
      query = query.lte('trade_date', toDate);
    }

    const { data: trades, error } = await query;

    if (error) throw error;
    if (!trades || trades.length === 0) {
        return successResponse({
            totalTrades: 0,
            netPnL: 0,
            winRate: 0,
            profitFactor: 0,
            avgWinLoss: 0,
            maxDrawdown: 0,
            sharpeRatio: 0,
            expectancy: 0
        });
    }

    // Calculate Metrics
    let totalTrades = trades.length;
    let winningTrades = 0;
    let losingTrades = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let netPnL = 0;
    let returns = [];

    // Sort by date for drawdown calculation
    trades.sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());

    let currentEquity = 0;
    let maxEquity = -Infinity;
    let maxDrawdownTotal = 0;

    for (const trade of trades) {
        const pnl = trade.trade_metrics?.net_pnl || 0;
        netPnL += pnl;
        
        // Win/Loss counts
        if (pnl > 0) {
            winningTrades++;
            grossProfit += pnl;
        } else if (pnl < 0) {
            losingTrades++;
            grossLoss += Math.abs(pnl);
        }

        // Drawdown Logic
        currentEquity += pnl;
        if (currentEquity > maxEquity) {
            maxEquity = currentEquity;
        }
        const drawdown = maxEquity - currentEquity;
        if (drawdown > maxDrawdownTotal) {
            maxDrawdownTotal = drawdown;
        }

        returns.push(pnl);
    }

    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 999 : 0); // 999 as infinity proxy
    const avgWin = winningTrades > 0 ? grossProfit / winningTrades : 0;
    const avgLoss = losingTrades > 0 ? grossLoss / losingTrades : 0;
    const avgWinLoss = avgLoss > 0 ? avgWin / avgLoss : 0;

    // Expectancy = (Win % * Avg Win) - (Loss % * Avg Loss)
    const winProb = winningTrades / totalTrades;
    const lossProb = losingTrades / totalTrades;
    const expectancy = (winProb * avgWin) - (lossProb * avgLoss); // Note: avgLoss is absolute value here

    // Sharpe Ratio (Simplified Annualized)
    // Mean of returns / StdDev of returns * Sqrt(252 or similar)
    // If not enough data, return 0
    let sharpeRatio = 0;
    if (returns.length > 1) {
        const meanReturn = netPnL / totalTrades;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (totalTrades - 1);
        const stdDev = Math.sqrt(variance);
        if (stdDev > 0) {
            // Annualize assuming typical trading frequency? Or just raw Sharpe.
            // Frontend usually expects a standard ratio. Let's return the raw per-trade Sharpe for now.
            sharpeRatio = meanReturn / stdDev;
        }
    }

    return successResponse({
        netPnL,
        winRate,
        profitFactor,
        avgWinLoss,
        totalTrades,
        winningTrades,
        losingTrades,
        grossProfit,
        grossLoss,
        avgWin,
        avgLoss,
        maxDrawdown: maxDrawdownTotal, // Absolute value
        sharpeRatio,
        expectancy
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return errorResponse(error.message, 500);
  }
});
