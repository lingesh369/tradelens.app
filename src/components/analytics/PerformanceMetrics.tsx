import React from 'react';
import { Trade } from "@/types/trade";
import { GlobalSettings } from "@/hooks/useGlobalSettings";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { format, differenceInMinutes, addDays, differenceInDays, parse } from 'date-fns';

interface PerformanceMetricsProps {
  trades: Trade[];
  settings: GlobalSettings | null;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ trades, settings }) => {
  // Format currency based on user settings
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    
    const currency = settings?.base_currency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  // Format time duration - updated to show 2 decimal places for minutes
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes.toFixed(2)} min${minutes !== 1 ? 's' : ''}`;
    } else if (minutes < 1440) { // Less than 24 hours
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours} hr${hours !== 1 ? 's' : ''} ${mins > 0 ? `${mins.toFixed(2)} min${mins !== 1 ? 's' : ''}` : ''}`;
    } else {
      const days = Math.floor(minutes / 1440);
      const hours = Math.floor((minutes % 1440) / 60);
      return `${days} day${days !== 1 ? 's' : ''} ${hours > 0 ? `${hours} hr${hours !== 1 ? 's' : ''}` : ''}`;
    }
  };

  // Calculate overall metrics
  const calculateMetrics = React.useMemo(() => {
    if (!trades.length) {
      return {
        totalPnL: 0,
        averageTradePnL: 0,
        profitFactor: 0,
        openTrades: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        breakEvenTrades: 0,
        maxConsecutiveWins: 0,
        maxConsecutiveLosses: 0,
        totalCommissions: 0,
        totalFees: 0,
        largestProfit: 0,
        largestLoss: 0,
        averageWin: 0,
        averageLoss: 0,
        averageHoldTimeWinning: 0,
        averageHoldTimeLosing: 0,
        averageHoldTimeScratch: 0,
        tradingDays: 0,
        winningDays: 0,
        losingDays: 0,
        breakEvenDays: 0,
        maxConsecutiveWinDays: 0,
        maxConsecutiveLoseDays: 0,
        averageDailyPnL: 0,
        averageWinningDayPnL: 0,
        averageLosingDayPnL: 0,
        largestProfitableDay: 0,
        largestLosingDay: 0,
        averagePlannedRMultiple: 0,
        averageRealizedRMultiple: 0,
        tradeExpectancy: 0
      };
    }

    // PnL related calculations
    const totalPnL = trades.reduce((sum, trade) => sum + (trade.net_pl || 0), 0);
    const averageTradePnL = totalPnL / trades.length;
    
    // Win/Loss calculations
    const winningTrades = trades.filter(trade => (trade.net_pl || 0) > 0);
    const losingTrades = trades.filter(trade => (trade.net_pl || 0) < 0);
    const breakEvenTrades = trades.filter(trade => (trade.net_pl || 0) === 0);
    const openTrades = trades.filter(trade => !trade.exit_time);
    
    // Profit factor calculation
    const totalProfits = winningTrades.reduce((sum, trade) => sum + (trade.net_pl || 0), 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.net_pl || 0), 0));
    const profitFactor = totalLosses === 0 ? totalProfits : totalProfits / totalLosses;
    
    // Largest profit and loss
    const largestProfit = winningTrades.length 
      ? Math.max(...winningTrades.map(trade => trade.net_pl || 0)) 
      : 0;
    const largestLoss = losingTrades.length 
      ? Math.min(...losingTrades.map(trade => trade.net_pl || 0)) 
      : 0;
    
    // Average metrics
    const averageWin = winningTrades.length 
      ? totalProfits / winningTrades.length 
      : 0;
    const averageLoss = losingTrades.length 
      ? totalLosses / losingTrades.length 
      : 0;
    
    // Commissions and fees
    const totalCommissions = trades.reduce((sum, trade) => sum + (trade.commission || 0), 0);
    const totalFees = trades.reduce((sum, trade) => sum + (trade.fees || 0), 0);
    
    // Hold time calculations
    const calculateHoldTime = (trade: Trade) => {
      if (!trade.entry_time || !trade.exit_time) return 0;
      const entryTime = new Date(trade.entry_time);
      const exitTime = new Date(trade.exit_time);
      return differenceInMinutes(exitTime, entryTime);
    };
    
    const winningTradeHoldTimes = winningTrades
      .map(calculateHoldTime)
      .filter(time => time > 0);
    
    const losingTradeHoldTimes = losingTrades
      .map(calculateHoldTime)
      .filter(time => time > 0);
    
    const scratchTradeHoldTimes = breakEvenTrades
      .map(calculateHoldTime)
      .filter(time => time > 0);
    
    const averageHoldTimeWinning = winningTradeHoldTimes.length 
      ? winningTradeHoldTimes.reduce((sum, time) => sum + time, 0) / winningTradeHoldTimes.length 
      : 0;
    
    const averageHoldTimeLosing = losingTradeHoldTimes.length 
      ? losingTradeHoldTimes.reduce((sum, time) => sum + time, 0) / losingTradeHoldTimes.length 
      : 0;
    
    const averageHoldTimeScratch = scratchTradeHoldTimes.length 
      ? scratchTradeHoldTimes.reduce((sum, time) => sum + time, 0) / scratchTradeHoldTimes.length 
      : 0;
    
    // Consecutive wins/losses
    let currentWins = 0;
    let maxConsecutiveWins = 0;
    let currentLosses = 0;
    let maxConsecutiveLosses = 0;
    
    // Sort trades by entry time
    const sortedTrades = [...trades].sort((a, b) => {
      if (!a.entry_time || !b.entry_time) return 0;
      return new Date(a.entry_time).getTime() - new Date(b.entry_time).getTime();
    });
    
    sortedTrades.forEach(trade => {
      const pnl = trade.net_pl || 0;
      if (pnl > 0) {
        currentWins++;
        currentLosses = 0;
        if (currentWins > maxConsecutiveWins) {
          maxConsecutiveWins = currentWins;
        }
      } else if (pnl < 0) {
        currentLosses++;
        currentWins = 0;
        if (currentLosses > maxConsecutiveLosses) {
          maxConsecutiveLosses = currentLosses;
        }
      } else {
        // Break-even trades reset both counters
        currentWins = 0;
        currentLosses = 0;
      }
    });
    
    // Daily metrics
    const dailyPnL = new Map<string, number>();
    
    trades.forEach(trade => {
      if (!trade.entry_time) return;
      const date = format(new Date(trade.entry_time), 'yyyy-MM-dd');
      const currentPnL = dailyPnL.get(date) || 0;
      dailyPnL.set(date, currentPnL + (trade.net_pl || 0));
    });
    
    const tradingDays = dailyPnL.size;
    const winningDays = Array.from(dailyPnL.values()).filter(pnl => pnl > 0).length;
    const losingDays = Array.from(dailyPnL.values()).filter(pnl => pnl < 0).length;
    const breakEvenDays = Array.from(dailyPnL.values()).filter(pnl => pnl === 0).length;
    
    const dailyPnLArray = Array.from(dailyPnL.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    
    let currentWinDays = 0;
    let maxConsecutiveWinDays = 0;
    let currentLoseDays = 0;
    let maxConsecutiveLoseDays = 0;
    
    dailyPnLArray.forEach(([_, pnl]) => {
      if (pnl > 0) {
        currentWinDays++;
        currentLoseDays = 0;
        if (currentWinDays > maxConsecutiveWinDays) {
          maxConsecutiveWinDays = currentWinDays;
        }
      } else if (pnl < 0) {
        currentLoseDays++;
        currentWinDays = 0;
        if (currentLoseDays > maxConsecutiveLoseDays) {
          maxConsecutiveLoseDays = currentLoseDays;
        }
      } else {
        // Break-even days reset both counters
        currentWinDays = 0;
        currentLoseDays = 0;
      }
    });
    
    const totalDailyPnL = Array.from(dailyPnL.values()).reduce((sum, pnl) => sum + pnl, 0);
    const averageDailyPnL = tradingDays ? totalDailyPnL / tradingDays : 0;
    
    const winningDaysPnL = Array.from(dailyPnL.values()).filter(pnl => pnl > 0);
    const losingDaysPnL = Array.from(dailyPnL.values()).filter(pnl => pnl < 0);
    
    const averageWinningDayPnL = winningDaysPnL.length
      ? winningDaysPnL.reduce((sum, pnl) => sum + pnl, 0) / winningDaysPnL.length
      : 0;
    
    const averageLosingDayPnL = losingDaysPnL.length
      ? losingDaysPnL.reduce((sum, pnl) => sum + pnl, 0) / losingDaysPnL.length
      : 0;
    
    const largestProfitableDay = winningDaysPnL.length ? Math.max(...winningDaysPnL) : 0;
    const largestLosingDay = losingDaysPnL.length ? Math.min(...losingDaysPnL) : 0;
    
    // R-Multiple and Expectancy calculations
    const tradesWithR = trades.filter(trade => trade.sl !== null && trade.entry_price !== null);
    
    const rMultiples = tradesWithR.map(trade => {
      const pnl = trade.net_pl || 0;
      const riskPerShare = Math.abs((trade.entry_price || 0) - (trade.sl || 0));
      const risk = riskPerShare * (trade.quantity || 0);
      return risk !== 0 ? pnl / risk : 0;
    });
    
    const averageRealizedRMultiple = rMultiples.length
      ? rMultiples.reduce((sum, r) => sum + r, 0) / rMultiples.length
      : 0;
    
    // Simplified expectancy calculation - average R multiple
    const tradeExpectancy = averageRealizedRMultiple;
    
    return {
      totalPnL,
      averageTradePnL,
      profitFactor,
      openTrades: openTrades.length,
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      breakEvenTrades: breakEvenTrades.length,
      maxConsecutiveWins,
      maxConsecutiveLosses,
      totalCommissions,
      totalFees,
      largestProfit,
      largestLoss,
      averageWin,
      averageLoss,
      averageHoldTimeWinning,
      averageHoldTimeLosing,
      averageHoldTimeScratch,
      tradingDays,
      winningDays,
      losingDays,
      breakEvenDays,
      maxConsecutiveWinDays,
      maxConsecutiveLoseDays,
      averageDailyPnL,
      averageWinningDayPnL,
      averageLosingDayPnL,
      largestProfitableDay,
      largestLosingDay,
      averagePlannedRMultiple: 0, // Not enough data for this
      averageRealizedRMultiple,
      tradeExpectancy
    };
  }, [trades]);

  const metrics = [
    { label: "Total P&L", value: formatCurrency(calculateMetrics.totalPnL) },
    { label: "Average Daily P&L", value: formatCurrency(calculateMetrics.averageDailyPnL) },
    { label: "Average Trade P&L", value: formatCurrency(calculateMetrics.averageTradePnL) },
    { label: "Profit Factor", value: calculateMetrics.profitFactor.toFixed(2) },
    { label: "Open Trades", value: calculateMetrics.openTrades },
    { label: "Total Number of Trades", value: calculateMetrics.totalTrades },
    { label: "Number of Winning Trades", value: calculateMetrics.winningTrades },
    { label: "Number of Losing Trades", value: calculateMetrics.losingTrades },
    { label: "Number of Break Even Trades", value: calculateMetrics.breakEvenTrades },
    { label: "Number of Consecutive Wins", value: calculateMetrics.maxConsecutiveWins },
    { label: "Number of Consecutive Losses", value: calculateMetrics.maxConsecutiveLosses },
    { label: "Total Commissions", value: formatCurrency(calculateMetrics.totalCommissions) },
    { label: "Total Fees", value: formatCurrency(calculateMetrics.totalFees) },
    { label: "Largest Profit", value: formatCurrency(calculateMetrics.largestProfit) },
    { label: "Largest Loss", value: formatCurrency(calculateMetrics.largestLoss) },
    { label: "Average Winning Trade", value: formatCurrency(calculateMetrics.averageWin) },
    { label: "Average Losing Trade", value: formatCurrency(calculateMetrics.averageLoss) },
    { label: "Average Hold Time (Winning Trades)", value: formatDuration(calculateMetrics.averageHoldTimeWinning) },
    { label: "Average Hold Time (Losing Trades)", value: formatDuration(calculateMetrics.averageHoldTimeLosing) },
    { label: "Average Hold Time (Scratch Trades)", value: formatDuration(calculateMetrics.averageHoldTimeScratch) },
    { label: "Total Trading Days", value: calculateMetrics.tradingDays },
    { label: "Winning Days", value: calculateMetrics.winningDays },
    { label: "Losing Days", value: calculateMetrics.losingDays },
    { label: "Break-even Days", value: calculateMetrics.breakEvenDays },
    { label: "Max Consecutive Winning Days", value: calculateMetrics.maxConsecutiveWinDays },
    { label: "Max Consecutive Losing Days", value: calculateMetrics.maxConsecutiveLoseDays },
    { label: "Average Winning Day P&L", value: formatCurrency(calculateMetrics.averageWinningDayPnL) },
    { label: "Average Losing Day P&L", value: formatCurrency(calculateMetrics.averageLosingDayPnL) },
    { label: "Largest Profitable Day", value: formatCurrency(calculateMetrics.largestProfitableDay) },
    { label: "Largest Losing Day", value: formatCurrency(calculateMetrics.largestLosingDay) },
    { label: "Average Realized R-Multiple", value: calculateMetrics.averageRealizedRMultiple.toFixed(2) },
    { label: "Trade Expectancy", value: calculateMetrics.tradeExpectancy.toFixed(2) }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            {metrics.slice(0, Math.ceil(metrics.length / 2)).map((metric, index) => (
              <div key={index} className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">{metric.label}</span>
                <span className="font-medium">{metric.value}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {metrics.slice(Math.ceil(metrics.length / 2)).map((metric, index) => (
              <div key={index} className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">{metric.label}</span>
                <span className="font-medium">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
