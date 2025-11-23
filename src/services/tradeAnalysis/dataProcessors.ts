
import { Trade } from '@/hooks/useTrades';
import { formatTradesForAI, createOptimizedTradeAnalysisPrompt, FormattedTradeData } from '@/utils/aiDataFormatters';
import { Account } from '@/hooks/useAccounts';
import { Strategy } from '@/hooks/useStrategies';
import { GlobalSettings } from '@/hooks/useGlobalSettings';

export interface DataProcessingResult {
  formattedData: FormattedTradeData;
  prompt: string;
  contextData: any;
  analysisStrategy: 'detailed' | 'summary' | 'compact';
  payloadSize: number;
}

export const processTradesForAnalysis = (
  selectedTrades: Trade[],
  accounts: Account[],
  strategies: Strategy[],
  settings: GlobalSettings | null | undefined
): DataProcessingResult => {
  // Smart trade limiting based on dataset size
  let limitedTrades;
  let analysisStrategy: 'detailed' | 'summary' | 'compact';
  
  if (selectedTrades.length <= 25) {
    // Small datasets: send all trades with full details
    limitedTrades = selectedTrades;
    analysisStrategy = 'detailed';
    console.log(`Small dataset: Using detailed analysis for ${limitedTrades.length} trades`);
  } else if (selectedTrades.length <= 100) {
    // Medium datasets: sample representative trades
    const recentTrades = selectedTrades.slice(0, 20);
    const olderTrades = selectedTrades.slice(20);
    const sampledOlderTrades = olderTrades.filter((_, index) => index % Math.ceil(olderTrades.length / 10) === 0).slice(0, 10);
    limitedTrades = [...recentTrades, ...sampledOlderTrades];
    analysisStrategy = 'summary';
    console.log(`Medium dataset: Using summary analysis for ${limitedTrades.length} of ${selectedTrades.length} trades`);
  } else {
    // Large datasets: only statistical summaries
    limitedTrades = selectedTrades.slice(0, 50); // Keep minimal sample for edge cases
    analysisStrategy = 'compact';
    console.log(`Large dataset: Using compact analysis for ${selectedTrades.length} trades`);
  }

  // Create account and strategy lookup maps
  const accountMap = accounts.reduce((acc, account) => {
    acc[account.account_id] = account.account_name;
    return acc;
  }, {} as { [key: string]: string });

  const strategyMap = strategies.reduce((acc, strategy) => {
    acc[strategy.strategy_id] = strategy.strategy_name;
    return acc;
  }, {} as { [key: string]: string });

  // Format trades for AI analysis (use original selectedTrades for statistics)
  const formattedData = formatTradesForAI(
    selectedTrades, // Use full dataset for accurate statistics
    accountMap,
    strategyMap,
    settings?.base_currency || 'USD'
  );

  // Create ultra-compact prompt optimized for payload size
  const prompt = createOptimizedTradeAnalysisPrompt(formattedData);

  // For large datasets, create ultra-compact payload
  let contextData;
  if (analysisStrategy === 'compact') {
    // Only send summary statistics for large datasets
    const compactSummary = createUltraCompactSummary(formattedData.trades);
    contextData = {
      summary: formattedData.summary,
      compactSummary,
      analysisType: 'statistical_only'
    };
  } else {
    // Send limited trade samples for smaller datasets
    contextData = {
      trades: limitedTrades.slice(0, 10), // Maximum 10 sample trades
      summary: formattedData.summary,
      analysisType: analysisStrategy
    };
  }

  // Final payload size validation (target <50KB)
  const payloadSize = JSON.stringify({ message: prompt, contextData }).length;

  return {
    formattedData,
    prompt,
    contextData,
    analysisStrategy,
    payloadSize
  };
};

// Helper function for ultra-compact summary (moved from aiDataFormatters)
function createUltraCompactSummary(trades: any[]) {
  return {
    count: trades.length,
    winRate: trades.filter(t => t.netPnL && t.netPnL > 0).length / trades.length,
    avgPnL: trades.reduce((sum, t) => sum + (t.netPnL || 0), 0) / trades.length,
    topPerformers: trades.filter(t => t.netPnL && t.netPnL > 0).slice(0, 3),
    bottomPerformers: trades.filter(t => t.netPnL && t.netPnL < 0).slice(-3)
  };
}
