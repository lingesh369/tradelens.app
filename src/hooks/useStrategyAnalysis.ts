
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { fetchTrades } from '@/api/trades/tradeQueries';
import { useAccounts } from '@/hooks/useAccounts';
import { useStrategies } from '@/hooks/useStrategies';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import { formatStrategiesForAI, createStrategyAnalysisPrompt } from '@/utils/aiDataFormatters';

export interface StrategyAnalysisResult {
  strategySummary: {
    [strategyId: string]: {
      winRate: number;
      avgRR: number;
      maxDrawdown: number;
      avgTradeDuration: string;
      successRateByInstrument: { [instrument: string]: number };
    };
  };
  contextFit: {
    [strategyId: string]: {
      bestIn: string[];
      worstIn: string[];
      optimalConditions: string[];
    };
  };
  commonMistakes: {
    [strategyId: string]: string[];
  };
  suggestedFilters: {
    [strategyId: string]: {
      timeOfDay: string[];
      volatilityWindows: string[];
      indicatorCombos: string[];
    };
  };
  strategyAdjustments: {
    [strategyId: string]: string[];
  };
  suggestions: string[];
  rawAIResponse?: string;
}

export const useStrategyAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<StrategyAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { accounts } = useAccounts();
  const { strategies } = useStrategies();
  const { settings } = useGlobalSettings();

  const analyzeStrategies = async (selectedStrategyIds: string[], dateRange: { from: Date; to: Date }) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      console.log('Starting strategy analysis...', { selectedStrategyIds, dateRange });

      // Get user profile - user.id IS the app_users.id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const appUserId = user.id; // No need for separate query

      // Filter selected strategies
      const selectedStrategies = selectedStrategyIds.length > 0
        ? strategies.filter(strategy => selectedStrategyIds.includes(strategy.strategy_id))
        : strategies;

      if (selectedStrategies.length === 0) {
        throw new Error('No strategies found for analysis');
      }

      // Fetch all trades and filter by strategies and date range
      const allTrades = await fetchTrades(appUserId);
      const strategyTrades = allTrades.filter(trade => {
        const matchesStrategy = selectedStrategies.some(s => s.strategy_id === trade.strategy_id);
        if (!matchesStrategy) return false;
        
        if (!trade.entry_time) return false;
        const tradeDate = new Date(trade.entry_time);
        return tradeDate >= dateRange.from && tradeDate <= dateRange.to;
      });

      if (strategyTrades.length === 0) {
        throw new Error('No trades found for the selected strategies and date range');
      }

      // Create account lookup map
      const accountMap = accounts.reduce((acc, account) => {
        acc[account.account_id] = account.account_name;
        return acc;
      }, {} as { [key: string]: string });

      // Format strategies for AI analysis
      const formattedData = formatStrategiesForAI(
        selectedStrategies,
        strategyTrades,
        accountMap,
        settings?.base_currency || 'USD'
      );

      // Create AI prompt
      const prompt = createStrategyAnalysisPrompt(formattedData);

      console.log('Sending formatted strategy data to AI:', {
        strategiesCount: formattedData.strategies.length,
        totalTrades: formattedData.summary.totalTrades,
        summary: formattedData.summary
      });

      // Call AI chat function with formatted data
      const { data, error: supabaseError } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: prompt,
          analysisType: 'strategy_analysis',
          formattedData,
          contextData: {
            strategies: formattedData.strategies,
            summary: formattedData.summary
          }
        },
      });

      if (supabaseError) {
        throw new Error(supabaseError.message || 'Failed to analyze strategies');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.response) {
        throw new Error('No analysis response received');
      }

      // Parse the AI response and structure it
      const result: StrategyAnalysisResult = {
        strategySummary: parseStrategySummary(data.response, formattedData),
        contextFit: parseContextFit(data.response, selectedStrategyIds),
        commonMistakes: parseCommonMistakes(data.response, selectedStrategyIds),
        suggestedFilters: parseSuggestedFilters(data.response, selectedStrategyIds),
        strategyAdjustments: parseStrategyAdjustments(data.response, selectedStrategyIds),
        suggestions: extractListFromResponse(data.response, 'recommendation', 'improve', 'suggest', 'should'),
        rawAIResponse: data.response,
      };

      setAnalysisResult(result);
      console.log('Strategy analysis completed successfully');

    } catch (error) {
      console.error('Strategy analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze strategies';
      setError(errorMessage);
      toast({
        title: "Analysis Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearAnalysis = () => {
    setAnalysisResult(null);
    setError(null);
  };

  return {
    isAnalyzing,
    analysisResult,
    error,
    analyzeStrategies,
    clearAnalysis,
  };
};

// Helper functions for parsing strategy-specific data
function parseStrategySummary(response: string, formattedData: any) {
  const summary: any = {};
  formattedData.strategies.forEach((strategy: any) => {
    summary[strategy.id] = {
      winRate: strategy.metrics.winRate,
      avgRR: strategy.metrics.avgRR,
      maxDrawdown: strategy.metrics.maxDrawdown,
      avgTradeDuration: strategy.metrics.avgTradeDuration,
      successRateByInstrument: calculateInstrumentSuccess(strategy.trades),
    };
  });
  return summary;
}

function calculateInstrumentSuccess(trades: any[]) {
  const instrumentStats = new Map<string, { wins: number; total: number }>();
  
  trades.forEach(trade => {
    const instrument = trade.instrument;
    const current = instrumentStats.get(instrument) || { wins: 0, total: 0 };
    current.total += 1;
    if ((trade.netPnL || 0) > 0) current.wins += 1;
    instrumentStats.set(instrument, current);
  });
  
  const result: { [key: string]: number } = {};
  instrumentStats.forEach((stats, instrument) => {
    result[instrument] = stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0;
  });
  
  return result;
}

function parseContextFit(response: string, strategyIds: string[]) {
  const contextFit: any = {};
  strategyIds.forEach(id => {
    contextFit[id] = {
      bestIn: extractListFromResponse(response, 'best in', 'works best', 'optimal', 'performs well'),
      worstIn: extractListFromResponse(response, 'worst in', 'struggles', 'poor', 'underperforms'),
      optimalConditions: extractListFromResponse(response, 'condition', 'when', 'environment', 'market'),
    };
  });
  return contextFit;
}

function parseCommonMistakes(response: string, strategyIds: string[]) {
  const mistakes: any = {};
  strategyIds.forEach(id => {
    mistakes[id] = extractListFromResponse(response, 'mistake', 'error', 'problem', 'issue', 'wrong');
  });
  return mistakes;
}

function parseSuggestedFilters(response: string, strategyIds: string[]) {
  const filters: any = {};
  strategyIds.forEach(id => {
    filters[id] = {
      timeOfDay: extractListFromResponse(response, 'time of day', 'session', 'hour', 'timing'),
      volatilityWindows: extractListFromResponse(response, 'volatility', 'volume', 'movement', 'active'),
      indicatorCombos: extractListFromResponse(response, 'indicator', 'signal', 'filter', 'confluence'),
    };
  });
  return filters;
}

function parseStrategyAdjustments(response: string, strategyIds: string[]) {
  const adjustments: any = {};
  strategyIds.forEach(id => {
    adjustments[id] = extractListFromResponse(response, 'adjust', 'improve', 'modify', 'change', 'tweak', 'optimize');
  });
  return adjustments;
}

function extractListFromResponse(response: string, ...keywords: string[]): string[] {
  const lines = response.split('\n');
  const results: string[] = [];
  
  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    for (const line of lines) {
      const lineLower = line.toLowerCase();
      if (lineLower.includes(keywordLower) && (line.includes('•') || line.includes('-') || line.includes('1.') || line.includes('2.') || line.includes('*'))) {
        const cleaned = line.replace(/^[\s•\-\d.*]+/, '').trim();
        if (cleaned && !results.includes(cleaned)) {
          results.push(cleaned);
        }
      }
    }
  }
  
  return results.slice(0, 5);
}
