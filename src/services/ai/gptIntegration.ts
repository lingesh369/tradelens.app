export interface GPTAnalysisRequest {
  csvContent: string;
  summaryContent: string;
  analysisType: 'trade' | 'strategy';
  prompt: string;
  tradesCsvContent?: string; // New optional field for journal analyzer
}

export interface GPTAnalysisResponse {
  analysis: string;
  sections: {
    performanceSummary?: string;
    behavioralPatterns?: string;
    riskEvaluation?: string;
    suggestions: string;
  };
}

export const analyzeWithGPT = async (request: GPTAnalysisRequest): Promise<GPTAnalysisResponse> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-trades-with-gpt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`
      },
      body: JSON.stringify({
        csvContent: request.csvContent,
        summaryContent: request.summaryContent,
        analysisType: request.analysisType,
        prompt: request.prompt,
        tradesCsvContent: request.tradesCsvContent // Include trades CSV if provided
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge Function Error Response:', errorText);
      throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
  } catch (error) {
    console.error('GPT Analysis error:', error);
    throw error;
  }
};

export const generateTradeAnalysisPrompt = (dateRange: { from: Date; to: Date }): string => {
  return `You're a professional trading analyst reviewing trade performance data.

I've uploaded two files:
1. A CSV file with detailed trade data between ${dateRange.from.toDateString()} and ${dateRange.to.toDateString()}
2. A summary text file with key metrics and context

Please analyze the trades and provide insights in these areas:

**Performance Summary**: Overall win rate, P&L, risk-reward patterns
**Behavioral Patterns**: Identify emotional trading, revenge trades, early exits, overtrading
**Risk Evaluation**: Position sizing consistency, stop loss usage, risk-reward ratios
**Entry/Exit Review**: Timing issues, entry delays, premature exits
**Improvement Suggestions**: Specific, actionable recommendations

Format your response with clear sections and focus on practical improvements the trader can implement immediately.`;
};

export const generateStrategyAnalysisPrompt = (strategyNames: string[], dateRange: { from: Date; to: Date }): string => {
  return `You're a trading strategy auditor evaluating strategy performance.

I've uploaded two files:
1. A CSV file with trades from strategies: ${strategyNames.join(', ')} between ${dateRange.from.toDateString()} and ${dateRange.to.toDateString()}
2. A summary text file with strategy metrics and context

Please analyze the strategy performance and provide insights in these areas:

**Strategy Performance**: Win rates, P&L, and consistency by strategy
**Setup Optimization**: Entry/exit rule improvements, filter suggestions
**Failing Conditions**: Market conditions where strategies underperform
**Market Matching**: Asset and timeframe optimization for each strategy
**Strategy Suggestions**: Rule modifications and parameter adjustments

Focus on when each strategy works best, what conditions cause failures, and specific improvements to the trading rules.`;
};
