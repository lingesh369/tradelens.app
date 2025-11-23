
import { useMemo } from 'react';
import { Trade } from "@/hooks/useTrades";
import { FilterOption } from './StrategyFilterSelector';
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { useStrategies } from "@/hooks/useStrategies";
import { formatCurrencyValue } from "@/lib/currency-data";

interface StrategyData {
  strategy: string;
  strategyName: string;
  netProfit: number;
  totalProfit: number;
  totalLoss: number;
  count: number;
  winCount: number;
  lossCount: number;
  avgRMultiple: number;
  totalRMultiple: number;
}

interface ChartData {
  name: string;
  value: number;
  count?: number;
}

interface TableData {
  strategy: string;
  netProfit: number;
  winRate: number;
  expectancy: number;
  avgRMultiple: number;
  totalProfit: number;
  totalLoss: number;
  trades: number;
}

export function useStrategyStats(trades: Trade[], filter: FilterOption) {
  const { settings } = useGlobalSettings();
  const { strategies } = useStrategies();
  const baseCurrency = settings?.base_currency || "USD";
  
  // Format currency based on user settings
  const formatCurrency = (value: number) => {
    return formatCurrencyValue(value, baseCurrency);
  };
  
  // Process trade data by strategy
  const strategyStats = useMemo(() => {
    // Group trades by strategy
    const strategyMap = new Map<string, StrategyData>();
    
    trades.forEach(trade => {
      if (!trade.strategy_id || trade.net_pl === null || trade.net_pl === undefined) return;
      
      const strategy = trade.strategy_id;
      // Find strategy name from strategies list
      const strategyInfo = strategies.find(s => s.strategy_id === strategy);
      const strategyName = strategyInfo?.strategy_name || strategy;
      
      const stats = strategyMap.get(strategy) || {
        strategy,
        strategyName,
        netProfit: 0,
        totalProfit: 0,
        totalLoss: 0,
        count: 0,
        winCount: 0,
        lossCount: 0,
        avgRMultiple: 0,
        totalRMultiple: 0
      };
      
      stats.count += 1;
      stats.netProfit += trade.net_pl;
      
      // Calculate R-multiple if stop loss is defined
      if (trade.sl && trade.sl > 0) {
        // Calculate risk based on stop loss
        const risk = Math.abs(trade.entry_price - trade.sl) * trade.quantity;
        if (risk > 0) {
          const rMultiple = trade.net_pl / risk;
          stats.totalRMultiple += rMultiple;
        }
      }
      
      if (trade.net_pl > 0) {
        stats.totalProfit += trade.net_pl;
        stats.winCount += 1;
      } else {
        stats.totalLoss += trade.net_pl;
        stats.lossCount += 1;
      }
      
      strategyMap.set(strategy, stats);
    });
    
    // Calculate average R-multiple for each strategy
    strategyMap.forEach(stats => {
      if (stats.count > 0) {
        stats.avgRMultiple = stats.totalRMultiple / stats.count;
      }
    });
    
    // Convert map to array and sort by net profit
    let statsArray = Array.from(strategyMap.values())
      .sort((a, b) => Math.abs(b.netProfit) - Math.abs(a.netProfit));
    
    return statsArray;
  }, [trades, strategies]);
  
  // Apply filter to get top strategies
  const filteredStrategyStats = useMemo(() => {
    if (filter === 'top5') return strategyStats.slice(0, 5);
    if (filter === 'top10') return strategyStats.slice(0, 10);
    return strategyStats;
  }, [strategyStats, filter]);
  
  // Format data for distribution chart
  const distributionData = useMemo(() => {
    return filteredStrategyStats.map(strategy => ({
      name: strategy.strategyName,
      value: strategy.count,
    }));
  }, [filteredStrategyStats]);
  
  // Format data for performance chart
  const performanceData = useMemo(() => {
    return filteredStrategyStats.map(strategy => ({
      name: strategy.strategyName,
      value: strategy.netProfit,
      count: strategy.count,
      formattedValue: formatCurrency(strategy.netProfit)
    }));
  }, [filteredStrategyStats, formatCurrency]);
  
  // Format data for summary table
  const tableData = useMemo(() => {
    return filteredStrategyStats.map(strategy => {
      const winRate = strategy.count > 0 ? (strategy.winCount / strategy.count) * 100 : 0;
      const expectancy = strategy.count > 0 ? strategy.netProfit / strategy.count : 0;
      
      return {
        strategy: strategy.strategyName,
        netProfit: strategy.netProfit,
        winRate,
        expectancy,
        avgRMultiple: strategy.avgRMultiple,
        totalProfit: strategy.totalProfit,
        totalLoss: Math.abs(strategy.totalLoss), // Convert to positive for display
        trades: strategy.count,
        formattedNetProfit: formatCurrency(strategy.netProfit),
        formattedExpectancy: formatCurrency(expectancy),
        formattedTotalProfit: formatCurrency(strategy.totalProfit),
        formattedTotalLoss: formatCurrency(Math.abs(strategy.totalLoss))
      };
    });
  }, [filteredStrategyStats, formatCurrency]);

  return {
    strategyStats,
    filteredStrategyStats,
    distributionData,
    performanceData,
    tableData,
    hasData: strategyStats.length > 0,
    formatCurrency
  };
}
