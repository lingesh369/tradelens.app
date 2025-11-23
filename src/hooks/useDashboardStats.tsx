
import { useMemo } from "react";
import { Trade } from "@/hooks/useTrades";

export const useDashboardStats = (filteredTrades: Trade[]) => {
  return useMemo(() => {
    if (filteredTrades.length === 0) {
      return {
        netPnL: 0,
        winRate: 0,
        profitFactor: 0,
        avgWinLoss: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        totalWins: 0,
        totalLosses: 0
      };
    }

    console.log("Calculating stats with filtered trades:", filteredTrades);
    const totalTrades = filteredTrades.length;
    const closedTrades = filteredTrades.filter(trade => trade.exit_price !== null);
    const winningTrades = closedTrades.filter(trade => (trade.net_pl || 0) > 0);
    const losingTrades = closedTrades.filter(trade => (trade.net_pl || 0) < 0);
    const totalWins = winningTrades.reduce((sum, trade) => sum + (trade.net_pl || 0), 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.net_pl || 0), 0));
    const netPnL = filteredTrades.reduce((sum, trade) => sum + (trade.net_pl || 0), 0);
    const winRate = closedTrades.length > 0 ? winningTrades.length / closedTrades.length * 100 : 0;
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 2 : 1;
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, trade) => sum + (trade.net_pl || 0), 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.net_pl || 0), 0)) / losingTrades.length : 0;
    const avgWinLoss = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 2 : 0;
    
    const calculatedStats = {
      netPnL,
      winRate,
      profitFactor,
      avgWinLoss,
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      totalWins,
      totalLosses
    };
    
    console.log("Calculated stats:", calculatedStats);
    return calculatedStats;
  }, [filteredTrades]);
};
