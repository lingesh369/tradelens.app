
import { useMemo } from "react";
import { Trade } from "@/hooks/useTrades";
import { subDays, isWithinInterval } from "date-fns";

export interface TraderStats {
  netPnL: number;
  winRate: number;
  profitFactor: number;
  avgWinLoss: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalWins: number;
  totalLosses: number;
  largestWin: number;
  largestLoss: number;
  avgWin: number;
  avgLoss: number;
}

interface UseTraderStatsProps {
  trades: Trade[];
  selectedAccountIds?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export const useTraderStats = ({ 
  trades, 
  selectedAccountIds = [], 
  dateRange 
}: UseTraderStatsProps): TraderStats => {
  return useMemo(() => {
    if (!trades || trades.length === 0) {
      return {
        netPnL: 0,
        winRate: 0,
        profitFactor: 0,
        avgWinLoss: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        totalWins: 0,
        totalLosses: 0,
        largestWin: 0,
        largestLoss: 0,
        avgWin: 0,
        avgLoss: 0
      };
    }

    // Filter trades by selected accounts
    let filteredTrades = trades;
    if (selectedAccountIds.length > 0) {
      filteredTrades = trades.filter(trade => 
        selectedAccountIds.includes(trade.account_id)
      );
    }

    // Filter trades by date range
    if (dateRange) {
      filteredTrades = filteredTrades.filter(trade => {
        if (!trade.entry_time) return false;
        const tradeDate = new Date(trade.entry_time);
        return isWithinInterval(tradeDate, {
          start: dateRange.from,
          end: dateRange.to
        });
      });
    }

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
        totalLosses: 0,
        largestWin: 0,
        largestLoss: 0,
        avgWin: 0,
        avgLoss: 0
      };
    }

    const totalTrades = filteredTrades.length;
    const netPnL = filteredTrades.reduce((sum, trade) => sum + (trade.net_pl || 0), 0);
    
    const winningTrades = filteredTrades.filter(trade => (trade.net_pl || 0) > 0);
    const losingTrades = filteredTrades.filter(trade => (trade.net_pl || 0) < 0);
    
    const totalWins = winningTrades.reduce((sum, trade) => sum + (trade.net_pl || 0), 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.net_pl || 0), 0));
    
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 2 : 1;
    
    const avgWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
    const avgWinLoss = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 2 : 0;
    
    const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.net_pl || 0)) : 0;
    const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.net_pl || 0)) : 0;

    return {
      netPnL,
      winRate,
      profitFactor,
      avgWinLoss,
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      totalWins,
      totalLosses,
      largestWin,
      largestLoss,
      avgWin,
      avgLoss
    };
  }, [trades, selectedAccountIds, dateRange]);
};
