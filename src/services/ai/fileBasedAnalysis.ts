
import { Trade } from "@/types/trade";
import { Strategy } from "@/hooks/useStrategies";

export interface AnalysisFilters {
  dateRange: {
    from: Date;
    to: Date;
  };
  selectedItems: string[]; // trade IDs or strategy IDs
}

export interface TradeAnalysisFiles {
  csvContent: string;
  summaryContent: string;
}

export interface StrategyAnalysisFiles {
  csvContent: string;
  summaryContent: string;
}

// Generate CSV content for trades
export const generateTradesCsv = (trades: Trade[]): string => {
  if (trades.length === 0) return '';

  const headers = [
    'Trade ID',
    'Instrument', 
    'Entry Date',
    'Exit Date',
    'Action',
    'Entry Price',
    'Exit Price',
    'Quantity',
    'Net P&L',
    'Percent Gain',
    'Status',
    'Stop Loss',
    'Target',
    'R:R',
    'Strategy',
    'Market Type',
    'Time Frame',
    'Tags',
    'Trade Rating',
    'Notes'
  ];

  const rows = trades.map(trade => [
    trade.trade_id,
    trade.instrument,
    trade.entry_time || '',
    trade.exit_time || '',
    trade.action,
    trade.entry_price || 0,
    trade.exit_price || 0,
    trade.quantity || 0,
    trade.net_pl || 0,
    trade.percent_gain || 0,
    trade.trade_result || trade.status || '',
    trade.sl || 0,
    trade.target || 0,
    trade.r2r || 0,
    '', // Strategy name will be resolved separately
    trade.market_type || '',
    trade.trade_time_frame || '',
    Array.isArray(trade.tags) ? trade.tags.join('; ') : '',
    trade.trade_rating || trade.rating || 0,
    trade.notes || ''
  ]);

  return [headers, ...rows].map(row => 
    row.map(cell => 
      typeof cell === 'string' && (cell.includes(',') || cell.includes('"')) 
        ? `"${cell.replace(/"/g, '""')}"` 
        : cell
    ).join(',')
  ).join('\n');
};

// Generate summary text for trades
export const generateTradesSummary = (
  trades: Trade[], 
  dateRange: { from: Date; to: Date },
  userIntent?: string
): string => {
  const totalTrades = trades.length;
  const winningTrades = trades.filter(t => (t.net_pl || 0) > 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  
  const totalPnL = trades.reduce((sum, t) => sum + (t.net_pl || 0), 0);
  const avgRR = trades.reduce((sum, t) => sum + (t.r2r || 0), 0) / totalTrades || 0;
  
  // Get most traded instrument
  const instrumentCount: Record<string, number> = {};
  trades.forEach(t => {
    instrumentCount[t.instrument] = (instrumentCount[t.instrument] || 0) + 1;
  });
  const topInstrument = Object.entries(instrumentCount)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
  
  // Analyze common patterns from tags/notes
  const commonTags = trades
    .flatMap(t => Array.isArray(t.tags) ? t.tags : [])
    .reduce((acc: Record<string, number>, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});
  
  const topTags = Object.entries(commonTags)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([tag]) => tag);

  return `Summary of Trades: ${dateRange.from.toDateString()} to ${dateRange.to.toDateString()}
Total Trades: ${totalTrades}
Win Rate: ${winRate.toFixed(1)}%
Net P&L: $${totalPnL.toFixed(2)}
Average Risk-Reward: ${avgRR.toFixed(2)}
Top Instrument: ${topInstrument}
Common Tags: ${topTags.join(', ') || 'None'}
${userIntent ? `User Focus: ${userIntent}` : ''}

Analysis Goal: Identify behavioral patterns, risk management issues, and entry/exit optimization opportunities.`;
};

// Generate CSV content for strategy analysis
export const generateStrategyCsv = (trades: Trade[], strategies: Strategy[]): string => {
  if (trades.length === 0) return '';

  const strategyMap = strategies.reduce((acc, strategy) => {
    acc[strategy.strategy_id] = strategy.strategy_name;
    return acc;
  }, {} as Record<string, string>);

  const headers = [
    'Trade ID',
    'Strategy Name',
    'Instrument',
    'Entry Date', 
    'Exit Date',
    'Action',
    'Entry Price',
    'Exit Price',
    'Net P&L',
    'Percent Gain',
    'R:R',
    'Market Type',
    'Tags',
    'Trade Rating'
  ];

  const rows = trades.map(trade => [
    trade.trade_id,
    strategyMap[trade.strategy_id || ''] || 'Unknown',
    trade.instrument,
    trade.entry_time || '',
    trade.exit_time || '',
    trade.action,
    trade.entry_price || 0,
    trade.exit_price || 0,
    trade.net_pl || 0,
    trade.percent_gain || 0,
    trade.r2r || 0,
    trade.market_type || '',
    Array.isArray(trade.tags) ? trade.tags.join('; ') : '',
    trade.trade_rating || trade.rating || 0
  ]);

  return [headers, ...rows].map(row => 
    row.map(cell => 
      typeof cell === 'string' && (cell.includes(',') || cell.includes('"')) 
        ? `"${cell.replace(/"/g, '""')}"` 
        : cell
    ).join(',')
  ).join('\n');
};

// Generate summary for strategy analysis
export const generateStrategySummary = (
  trades: Trade[], 
  strategies: Strategy[],
  dateRange: { from: Date; to: Date }
): string => {
  const strategyMap = strategies.reduce((acc, strategy) => {
    acc[strategy.strategy_id] = strategy.strategy_name;
    return acc;
  }, {} as Record<string, string>);

  const strategyStats = strategies.map(strategy => {
    const strategyTrades = trades.filter(t => t.strategy_id === strategy.strategy_id);
    const winningTrades = strategyTrades.filter(t => (t.net_pl || 0) > 0).length;
    const winRate = strategyTrades.length > 0 ? (winningTrades / strategyTrades.length) * 100 : 0;
    const totalPnL = strategyTrades.reduce((sum, t) => sum + (t.net_pl || 0), 0);
    const avgRR = strategyTrades.reduce((sum, t) => sum + (t.r2r || 0), 0) / strategyTrades.length || 0;

    return {
      name: strategy.strategy_name,
      trades: strategyTrades.length,
      winRate: winRate.toFixed(1),
      pnl: totalPnL.toFixed(2),
      avgRR: avgRR.toFixed(2)
    };
  });

  return `Strategy Analysis: ${dateRange.from.toDateString()} to ${dateRange.to.toDateString()}
Selected Strategies: ${strategies.map(s => s.strategy_name).join(', ')}
Total Trades Analyzed: ${trades.length}

Strategy Performance:
${strategyStats.map(s => 
  `${s.name}: ${s.trades} trades, ${s.winRate}% win rate, $${s.pnl} P&L, ${s.avgRR} avg R:R`
).join('\n')}

Analysis Goal: Evaluate strategy performance, identify optimal conditions, and suggest improvements.`;
};
