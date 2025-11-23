
import { TradeAnalysisResult } from './types';
import { FormattedTradeData } from '@/utils/aiDataFormatters';

export const parseAnalysisResult = (
  aiResponse: string, 
  formattedData: FormattedTradeData
): TradeAnalysisResult => {
  return {
    summary: {
      tradeCount: formattedData.summary.totalTrades,
      winRate: formattedData.summary.winRate,
      avgRR: formattedData.summary.avgRR,
      netPnL: formattedData.summary.netPnL,
      winningDayRatio: calculateWinningDayRatio(formattedData),
    },
    additionalInsights: extractAdditionalInsights(aiResponse),
    suggestions: extractListFromResponse(aiResponse, 'recommendation', 'improve', 'suggest', 'should'),
    rawAIResponse: aiResponse,
  };
};

// Helper function to extract additional insights
function extractAdditionalInsights(response: string): TradeAnalysisResult['additionalInsights'] | undefined {
  const consistencyScore = extractListFromResponse(response, 'consistency', 'consistent', 'sl usage', 'r:r patterns');
  const tradeTypeBreakdown = extractListFromResponse(response, 'scalp', 'swing', 'breakdown', 'trade type');

  if (consistencyScore.length > 0 || tradeTypeBreakdown.length > 0) {
    return {
      consistencyScore,
      tradeTypeBreakdown,
    };
  }

  return undefined;
}

// Helper function to calculate winning day ratio
function calculateWinningDayRatio(data: FormattedTradeData): number {
  const dailyPnL = new Map<string, number>();
  
  data.trades.forEach(trade => {
    if (trade.entryTime && trade.netPnL !== null) {
      const date = trade.entryTime.split('T')[0];
      const currentPnL = dailyPnL.get(date) || 0;
      dailyPnL.set(date, currentPnL + trade.netPnL);
    }
  });
  
  const totalDays = dailyPnL.size;
  const winningDays = Array.from(dailyPnL.values()).filter(pnl => pnl > 0).length;
  
  return totalDays > 0 ? Math.round((winningDays / totalDays) * 100 * 100) / 100 : 0;
}

// Helper functions to extract data from AI response
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
  
  return results.slice(0, 5); // Limit to 5 items
}
