
import { supabase } from '@/integrations/supabase/client';
import { Trade } from '@/hooks/useTrades';
import { Account } from '@/hooks/useAccounts';
import { Strategy } from '@/hooks/useStrategies';
import { GlobalSettings } from '@/hooks/useGlobalSettings';
import { fetchTrades } from '@/api/trades/tradeQueries';
import { processTradesForAnalysis } from './dataProcessors';
import { parseAnalysisResult } from './resultParsers';
import { TradeAnalysisResult } from './types';

export interface AnalysisParams {
  selectedTradeIds: string[];
  dateRange: { from: Date; to: Date };
  appUserId: string;
  accounts: Account[];
  strategies: Strategy[];
  settings: GlobalSettings | null | undefined;
}

export const performTradeAnalysis = async (params: AnalysisParams): Promise<TradeAnalysisResult> => {
  const { selectedTradeIds, dateRange, appUserId, accounts, strategies, settings } = params;

  console.log('Starting trade analysis...', { selectedTradeIds, dateRange });

  // Fetch all user trades to filter by selected IDs
  const allTrades = await fetchTrades(appUserId);
  const selectedTrades = selectedTradeIds.length > 0 
    ? allTrades.filter(trade => selectedTradeIds.includes(trade.trade_id))
    : allTrades.filter(trade => {
        // Fix TypeScript error: Use entry_time first, fallback to entry_time (not trade_date)
        const tradeDateTime = trade.entry_time;
        if (!tradeDateTime) return false;
        const tradeDate = new Date(tradeDateTime);
        return tradeDate >= dateRange.from && tradeDate <= dateRange.to;
      });

  if (selectedTrades.length === 0) {
    throw new Error('No trades found for the selected criteria');
  }

  console.log(`Processing ${selectedTrades.length} trades for analysis`);

  // Process trades for analysis
  const { formattedData, prompt, contextData, analysisStrategy, payloadSize } = processTradesForAnalysis(
    selectedTrades,
    accounts,
    strategies,
    settings
  );

  console.log('AI analysis strategy:', {
    strategy: analysisStrategy,
    originalTradesCount: selectedTrades.length,
    promptLength: prompt.length,
    payloadSize: `${(payloadSize / 1024).toFixed(1)}KB`,
    summary: formattedData.summary
  });

  // Validate prompt size (target <2KB for prompts)
  if (prompt.length > 2048) {
    console.warn(`Prompt size ${prompt.length} chars exceeds 2KB target`);
  }

  // Final payload size validation (target <50KB)
  if (payloadSize > 51200) { // 50KB limit
    throw new Error('Dataset too large for analysis. Please select a smaller date range or fewer trades.');
  }

  // Call AI chat function with optimized data
  const { data, error: supabaseError } = await supabase.functions.invoke('ai-chat', {
    body: {
      message: prompt,
      analysisType: 'trade_analysis',
      contextData
    },
  });

  if (supabaseError) {
    console.error('Supabase function error:', supabaseError);
    throw new Error(supabaseError.message || 'Failed to analyze trades');
  }

  if (data?.error) {
    console.error('AI analysis error:', data.error);
    throw new Error(data.error);
  }

  if (!data?.response) {
    throw new Error('No analysis response received');
  }

  console.log('AI analysis completed successfully');

  // Parse and return the analysis result
  return parseAnalysisResult(data.response, formattedData);
};
