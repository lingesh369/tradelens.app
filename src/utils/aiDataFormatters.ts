import { Trade } from "@/types/trade";
import { formatCurrency } from "./tradeUtils";

export interface FormattedTradeData {
  summary: {
    totalTrades: number;
    winRate: number;
    avgRR: number;
    netPnL: number;
    totalFees: number;
    dateRange: string;
  };
  trades: FormattedTrade[];
  accounts: { [key: string]: string };
  strategies: { [key: string]: string };
}

export interface FormattedTrade {
  id: string;
  instrument: string;
  action: string;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  entryTime: string;
  exitTime: string | null;
  netPnL: number | null;
  percentGain: number | null;
  rMultiple: number | null;
  outcome: string | null;
  duration: string | null;
  accountName: string;
  strategyName: string;
  notes: string | null;
  rating: number | null;
  stopLoss: number | null;
  target: number | null;
  timeframe: string | null;
  fees: number;
}

// Ultra-compact trade summary for large datasets
export interface UltraCompactSummary {
  dailyStats: {
    date: string;
    trades: number;
    pnl: number;
    winRate: number;
  }[];
  instrumentBreakdown: {
    [instrument: string]: {
      trades: number;
      winRate: number;
      avgRR: number;
      totalPnL: number;
    };
  };
  strategyBreakdown: {
    [strategy: string]: {
      trades: number;
      winRate: number;
      totalPnL: number;
    };
  };
  patterns: {
    bestPerformingDay: string;
    worstPerformingDay: string;
    mostTradedInstrument: string;
    bestStrategy: string;
    avgTradesPerDay: number;
    consecutiveWins: number;
    consecutiveLosses: number;
  };
}

// Create ultra-compact summary for datasets >25 trades
export const createUltraCompactSummary = (trades: FormattedTrade[]): UltraCompactSummary => {
  // Group by day
  const dailyGroups = new Map<string, FormattedTrade[]>();
  trades.forEach(trade => {
    if (trade.entryTime) {
      const date = trade.entryTime.split('T')[0];
      if (!dailyGroups.has(date)) {
        dailyGroups.set(date, []);
      }
      dailyGroups.get(date)!.push(trade);
    }
  });

  // Calculate daily stats
  const dailyStats = Array.from(dailyGroups.entries()).map(([date, dayTrades]) => {
    const wins = dayTrades.filter(t => (t.netPnL || 0) > 0).length;
    const totalPnL = dayTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0);
    
    return {
      date,
      trades: dayTrades.length,
      pnl: Math.round(totalPnL * 100) / 100,
      winRate: Math.round((wins / dayTrades.length) * 100 * 100) / 100
    };
  }).slice(-10); // Only last 10 days

  // Instrument breakdown
  const instrumentGroups = new Map<string, FormattedTrade[]>();
  trades.forEach(trade => {
    if (!instrumentGroups.has(trade.instrument)) {
      instrumentGroups.set(trade.instrument, []);
    }
    instrumentGroups.get(trade.instrument)!.push(trade);
  });

  const instrumentBreakdown: UltraCompactSummary['instrumentBreakdown'] = {};
  instrumentGroups.forEach((instrTrades, instrument) => {
    const wins = instrTrades.filter(t => (t.netPnL || 0) > 0).length;
    const validRR = instrTrades.filter(t => t.rMultiple !== null && t.rMultiple !== undefined);
    const avgRR = validRR.length > 0 
      ? validRR.reduce((sum, t) => sum + (t.rMultiple || 0), 0) / validRR.length 
      : 0;
    const totalPnL = instrTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0);

    instrumentBreakdown[instrument] = {
      trades: instrTrades.length,
      winRate: Math.round((wins / instrTrades.length) * 100 * 100) / 100,
      avgRR: Math.round(avgRR * 100) / 100,
      totalPnL: Math.round(totalPnL * 100) / 100
    };
  });

  // Strategy breakdown
  const strategyGroups = new Map<string, FormattedTrade[]>();
  trades.forEach(trade => {
    if (!strategyGroups.has(trade.strategyName)) {
      strategyGroups.set(trade.strategyName, []);
    }
    strategyGroups.get(trade.strategyName)!.push(trade);
  });

  const strategyBreakdown: UltraCompactSummary['strategyBreakdown'] = {};
  strategyGroups.forEach((stratTrades, strategy) => {
    const wins = stratTrades.filter(t => (t.netPnL || 0) > 0).length;
    const totalPnL = stratTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0);

    strategyBreakdown[strategy] = {
      trades: stratTrades.length,
      winRate: Math.round((wins / stratTrades.length) * 100 * 100) / 100,
      totalPnL: Math.round(totalPnL * 100) / 100
    };
  });

  // Calculate patterns
  const sortedDaily = dailyStats.sort((a, b) => b.pnl - a.pnl);
  const bestDay = sortedDaily[0]?.date || 'N/A';
  const worstDay = sortedDaily[sortedDaily.length - 1]?.date || 'N/A';
  
  const mostTradedInstr = Array.from(instrumentGroups.entries())
    .sort(([,a], [,b]) => b.length - a.length)[0]?.[0] || 'N/A';
  
  const bestStrat = Array.from(strategyGroups.entries())
    .map(([name, trades]) => ({
      name,
      pnl: trades.reduce((sum, t) => sum + (t.netPnL || 0), 0)
    }))
    .sort((a, b) => b.pnl - a.pnl)[0]?.name || 'N/A';

  // Calculate streaks
  let consecutiveWins = 0;
  let consecutiveLosses = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  
  trades.forEach(trade => {
    if ((trade.netPnL || 0) > 0) {
      currentWinStreak++;
      currentLossStreak = 0;
      consecutiveWins = Math.max(consecutiveWins, currentWinStreak);
    } else if ((trade.netPnL || 0) < 0) {
      currentLossStreak++;
      currentWinStreak = 0;
      consecutiveLosses = Math.max(consecutiveLosses, currentLossStreak);
    }
  });

  return {
    dailyStats,
    instrumentBreakdown,
    strategyBreakdown,
    patterns: {
      bestPerformingDay: bestDay,
      worstPerformingDay: worstDay,
      mostTradedInstrument: mostTradedInstr,
      bestStrategy: bestStrat,
      avgTradesPerDay: Math.round((trades.length / Math.max(dailyStats.length, 1)) * 100) / 100,
      consecutiveWins,
      consecutiveLosses
    }
  };
};

export const formatTradesForAI = (
  trades: Trade[],
  accounts: { [key: string]: string } = {},
  strategies: { [key: string]: string } = {},
  baseCurrency: string = "USD"
): FormattedTradeData => {
  const formattedTrades: FormattedTrade[] = trades.map(trade => {
    return {
      id: trade.trade_id,
      instrument: trade.instrument,
      action: trade.action,
      entryPrice: trade.entry_price,
      exitPrice: trade.exit_price,
      quantity: trade.quantity,
      entryTime: trade.entry_time || '', // Fix: use entry_time directly instead of trade_date
      exitTime: trade.exit_time || null,
      netPnL: trade.net_pl || null,
      percentGain: trade.percent_gain || null,
      rMultiple: trade.r2r || null,
      outcome: trade.trade_result || (trade.exit_price ? 'CLOSED' : 'OPEN'),
      duration: trade.trade_duration?.toString() || null,
      accountName: accounts[trade.account_id || ''] || trade.account_id || 'Unknown',
      strategyName: strategies[trade.strategy_id || ''] || 'No Strategy',
      notes: trade.notes,
      rating: trade.rating,
      stopLoss: trade.sl,
      target: trade.target,
      timeframe: trade.trade_time_frame,
      fees: (trade.commission || 0) + (trade.fees || 0)
    };
  });

  // Calculate summary metrics
  const totalTrades = formattedTrades.length;
  const winningTrades = formattedTrades.filter(t => (t.netPnL || 0) > 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  
  const validRMultiples = formattedTrades.filter(t => t.rMultiple !== null && t.rMultiple !== undefined);
  const avgRR = validRMultiples.length > 0 
    ? validRMultiples.reduce((sum, t) => sum + (t.rMultiple || 0), 0) / validRMultiples.length 
    : 0;
  
  const netPnL = formattedTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0);
  const totalFees = formattedTrades.reduce((sum, t) => sum + t.fees, 0);
  
  const dates = formattedTrades
    .map(t => t.entryTime)
    .filter(d => d)
    .sort();
  const dateRange = dates.length > 0 
    ? `${dates[0].split('T')[0]} to ${dates[dates.length - 1].split('T')[0]}`
    : 'No date range';

  return {
    summary: {
      totalTrades,
      winRate: Math.round(winRate * 100) / 100,
      avgRR: Math.round(avgRR * 100) / 100,
      netPnL: Math.round(netPnL * 100) / 100,
      totalFees: Math.round(totalFees * 100) / 100,
      dateRange
    },
    trades: formattedTrades,
    accounts,
    strategies
  };
};

// Ultra-compact prompt creation for different dataset sizes
export const createOptimizedTradeAnalysisPrompt = (data: FormattedTradeData): string => {
  const tradeCount = data.trades.length;
  
  if (tradeCount <= 25) {
    // Small datasets: Send abbreviated trade details
    return `Analyze ${tradeCount} trades (${data.summary.dateRange}):

SUMMARY: ${data.summary.winRate}% WR, ${data.summary.avgRR} R:R, $${data.summary.netPnL} P&L

TRADES:
${data.trades.slice(0, 25).map(t => 
  `${t.instrument} ${t.action}: ${t.outcome} ($${t.netPnL || 0}) R:${t.rMultiple || 'N/A'}`
).join('\n')}

Focus: Consistency patterns, trade type breakdown, 3-5 improvement suggestions.`;
  }
  
  if (tradeCount <= 100) {
    // Medium datasets: Sample trades + daily breakdown
    const sampleTrades = data.trades.filter((_, i) => i % Math.ceil(tradeCount / 10) === 0).slice(0, 10);
    const compactSummary = createUltraCompactSummary(data.trades);
    
    return `${tradeCount} trades analysis (${data.summary.dateRange}):

SUMMARY: ${data.summary.winRate}% WR, ${data.summary.avgRR} R:R, $${data.summary.netPnL} P&L

SAMPLE (${sampleTrades.length}):
${sampleTrades.map(t => `${t.instrument}: ${t.outcome} ($${t.netPnL || 0})`).join(', ')}

DAILY: ${compactSummary.dailyStats.slice(-5).map(d => `${d.date}: ${d.trades}T $${d.pnl}`).join(', ')}

INSTRUMENTS: ${Object.entries(compactSummary.instrumentBreakdown).slice(0, 3).map(([i, s]) => `${i}:${s.winRate}%`).join(', ')}

Analysis: Patterns, breakdown, improvements.`;
  }
  
  // Large datasets: Only aggregated statistics
  const compactSummary = createUltraCompactSummary(data.trades);
  
  return `${tradeCount} trades analysis (${data.summary.dateRange}):

PERFORMANCE: ${data.summary.winRate}% WR, ${data.summary.avgRR} R:R, $${data.summary.netPnL} P&L

PATTERNS:
- Best day: ${compactSummary.patterns.bestPerformingDay}
- Top instrument: ${compactSummary.patterns.mostTradedInstrument}
- Best strategy: ${compactSummary.patterns.bestStrategy}
- Avg trades/day: ${compactSummary.patterns.avgTradesPerDay}
- Max win streak: ${compactSummary.patterns.consecutiveWins}

RECENT DAYS:
${compactSummary.dailyStats.slice(-3).map(d => `${d.date}: ${d.trades}T, $${d.pnl}, ${d.winRate}%WR`).join('\n')}

Provide: Consistency insights, strategy breakdown, key improvements.`;
};

export const createTradeAnalysisPrompt = createOptimizedTradeAnalysisPrompt;

export const formatStrategiesForAI = (
  strategies: any[],
  allTrades: Trade[],
  accounts: { [key: string]: string } = {},
  baseCurrency: string = "USD"
): FormattedStrategyData => {
  const strategyMap = new Map(strategies.map(s => [s.strategy_id, s.strategy_name]));
  
  const formattedStrategies: FormattedStrategy[] = strategies.map(strategy => {
    const strategyTrades = allTrades.filter(t => t.strategy_id === strategy.strategy_id);
    const formattedTrades = formatTradesForAI(strategyTrades, accounts, Object.fromEntries(strategyMap)).trades;
    
    // Calculate strategy metrics
    const totalTrades = formattedTrades.length;
    const winningTrades = formattedTrades.filter(t => (t.netPnL || 0) > 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    
    const validRMultiples = formattedTrades.filter(t => t.rMultiple !== null);
    const avgRR = validRMultiples.length > 0 
      ? validRMultiples.reduce((sum, t) => sum + (t.rMultiple || 0), 0) / validRMultiples.length 
      : 0;
    
    const netPnL = formattedTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0);
    
    // Calculate max drawdown
    let runningPnL = 0;
    let peak = 0;
    let maxDrawdown = 0;
    
    formattedTrades.forEach(trade => {
      runningPnL += trade.netPnL || 0;
      if (runningPnL > peak) peak = runningPnL;
      const drawdown = peak - runningPnL;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });
    
    // Calculate average trade duration
    const validDurations = formattedTrades.filter(t => t.duration && t.duration !== 'null');
    const avgTradeDuration = validDurations.length > 0 
      ? `${Math.round(validDurations.length / totalTrades * 100)}% completed trades`
      : 'No duration data';
    
    // Find best/worst performing instruments
    const instrumentPnL = new Map<string, number>();
    formattedTrades.forEach(trade => {
      const current = instrumentPnL.get(trade.instrument) || 0;
      instrumentPnL.set(trade.instrument, current + (trade.netPnL || 0));
    });
    
    const sortedInstruments = Array.from(instrumentPnL.entries()).sort((a, b) => b[1] - a[1]);
    const bestInstrument = sortedInstruments[0]?.[0] || 'None';
    const worstInstrument = sortedInstruments[sortedInstruments.length - 1]?.[0] || 'None';
    
    return {
      id: strategy.strategy_id,
      name: strategy.strategy_name,
      description: strategy.description,
      trades: formattedTrades,
      metrics: {
        totalTrades,
        winRate: Math.round(winRate * 100) / 100,
        avgRR: Math.round(avgRR * 100) / 100,
        netPnL: Math.round(netPnL * 100) / 100,
        maxDrawdown: Math.round(maxDrawdown * 100) / 100,
        avgTradeDuration,
        bestInstrument,
        worstInstrument
      }
    };
  });
  
  // Calculate overall summary
  const allFormattedTrades = formattedStrategies.flatMap(s => s.trades);
  const totalTrades = allFormattedTrades.length;
  const winningTrades = allFormattedTrades.filter(t => (t.netPnL || 0) > 0).length;
  const overallWinRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const overallNetPnL = allFormattedTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0);
  
  const dates = allFormattedTrades
    .map(t => t.entryTime)
    .filter(d => d)
    .sort();
  const dateRange = dates.length > 0 
    ? `${dates[0].split('T')[0]} to ${dates[dates.length - 1].split('T')[0]}`
    : 'No date range';
  
  return {
    summary: {
      totalStrategies: formattedStrategies.length,
      totalTrades,
      overallWinRate: Math.round(overallWinRate * 100) / 100,
      overallNetPnL: Math.round(overallNetPnL * 100) / 100,
      dateRange
    },
    strategies: formattedStrategies
  };
};

export const createStrategyAnalysisPrompt = (data: FormattedStrategyData): string => {
  return `You are analyzing ${data.summary.totalStrategies} strategies with ${data.summary.totalTrades} total trades from ${data.summary.dateRange}.

OVERALL PERFORMANCE:
- Total Strategies: ${data.summary.totalStrategies}
- Total Trades: ${data.summary.totalTrades}
- Overall Win Rate: ${data.summary.overallWinRate}%
- Overall Net P&L: $${data.summary.overallNetPnL}

STRATEGY BREAKDOWN:
${data.strategies.map(strategy => `
${strategy.name}:
- Total Trades: ${strategy.metrics.totalTrades}
- Win Rate: ${strategy.metrics.winRate}%
- Net P&L: $${strategy.metrics.netPnL}
- Best Instrument: ${strategy.metrics.bestInstrument}
`).join('\n')}

Provide comprehensive strategy analysis covering:
1. **Strategy Performance Ranking**: Rank strategies by effectiveness
2. **Contextual Analysis**: When each strategy works best
3. **Strategy Optimization**: Specific improvements for each strategy
4. **Resource Allocation**: Capital allocation recommendations
5. **Overall Recommendations**: Portfolio-level strategy adjustments

Focus on data-driven insights and provide specific recommendations.`;
};

export interface FormattedStrategyData {
  summary: {
    totalStrategies: number;
    totalTrades: number;
    overallWinRate: number;
    overallNetPnL: number;
    dateRange: string;
  };
  strategies: FormattedStrategy[];
}

export interface FormattedStrategy {
  id: string;
  name: string;
  description: string | null;
  trades: FormattedTrade[];
  metrics: {
    totalTrades: number;
    winRate: number;
    avgRR: number;
    netPnL: number;
    maxDrawdown: number;
    avgTradeDuration: string;
    bestInstrument: string;
    worstInstrument: string;
  };
}

// Compact trade summary for large datasets
export interface CompactTradeSummary {
  instrument: string;
  action: string;
  outcome: string | null;
  netPnL: number | null;
  rMultiple: number | null;
  strategyName: string;
  timeframe: string | null;
  date: string;
}

export const createCompactTradeSummary = (trades: FormattedTrade[]): CompactTradeSummary[] => {
  return trades.map(trade => ({
    instrument: trade.instrument,
    action: trade.action,
    outcome: trade.outcome,
    netPnL: trade.netPnL,
    rMultiple: trade.rMultiple,
    strategyName: trade.strategyName,
    timeframe: trade.timeframe,
    date: trade.entryTime.split('T')[0]
  }));
};

// Group trades by time periods for analysis
export const groupTradesByPeriod = (trades: FormattedTrade[], period: 'day' | 'week'): any[] => {
  const groups = new Map();
  
  trades.forEach(trade => {
    if (!trade.entryTime) return;
    
    const date = new Date(trade.entryTime);
    let key: string;
    
    if (period === 'day') {
      key = date.toISOString().split('T')[0];
    } else {
      // Week grouping
      const week = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000));
      key = `week-${week}`;
    }
    
    if (!groups.has(key)) {
      groups.set(key, {
        period: key,
        trades: [],
        totalPnL: 0,
        winCount: 0,
        lossCount: 0
      });
    }
    
    const group = groups.get(key);
    group.trades.push(trade);
    group.totalPnL += trade.netPnL || 0;
    
    if ((trade.netPnL || 0) > 0) group.winCount++;
    else if ((trade.netPnL || 0) < 0) group.lossCount++;
  });
  
  return Array.from(groups.values());
};
