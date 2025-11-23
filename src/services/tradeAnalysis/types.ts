
export interface TradeAnalysisResult {
  summary: {
    tradeCount: number;
    winRate: number;
    avgRR: number;
    netPnL: number;
    winningDayRatio: number;
  };
  additionalInsights?: {
    consistencyScore: string[];
    tradeTypeBreakdown: string[];
  };
  suggestions: string[];
  rawAIResponse?: string;
}
