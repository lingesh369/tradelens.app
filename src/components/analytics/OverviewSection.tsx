
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { format } from "date-fns";
import { Trade } from "@/types/trade";
import { GlobalSettings } from "@/hooks/useGlobalSettings";
import { PerformanceMetrics } from "@/components/analytics/PerformanceMetrics";
import { NetDailyPnLChart } from "@/components/dashboard/NetDailyPnLChart";
import { CumulativePnLChart } from "@/components/analytics/CumulativePnLChart";
import { DateRange } from "@/components/filters/DateRangeSelector";
import { formatCurrencyValue, getCurrencyByCode } from "@/lib/currency-data";

interface OverviewSectionProps {
  trades: Trade[];
  dateRange: DateRange;
  settings: GlobalSettings | null;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({ 
  trades, 
  dateRange,
  settings 
}) => {
  // Format date range for display
  const formatDateRange = () => {
    const fromStr = format(dateRange.from, 'MMM d, yyyy');
    const toStr = format(dateRange.to, 'MMM d, yyyy');
    return `${fromStr} - ${toStr}`;
  };

  // Calculate overview metrics
  const overviewMetrics = React.useMemo(() => {
    if (trades.length === 0) {
      return {
        netPnL: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0
      };
    }

    const netPnL = trades.reduce((sum, trade) => sum + (trade.net_pl || 0), 0);
    const winningTrades = trades.filter(trade => (trade.net_pl || 0) > 0);
    const losingTrades = trades.filter(trade => (trade.net_pl || 0) < 0);
    
    const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
    
    const totalWinnings = winningTrades.reduce((sum, trade) => sum + (trade.net_pl || 0), 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.net_pl || 0), 0));
    
    const avgWin = winningTrades.length > 0 ? totalWinnings / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;

    return {
      netPnL,
      winRate,
      avgWin,
      avgLoss
    };
  }, [trades]);

  // Calculate monthly PnL data
  const monthlyPnL = React.useMemo(() => {
    const monthMap = new Map<string, number>();
    
    trades.forEach(trade => {
      if (!trade.entry_time || trade.net_pl === undefined || trade.net_pl === null) return;
      
      const date = new Date(trade.entry_time);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const monthDisplay = format(date, 'MMM yyyy');
      
      const currentValue = monthMap.get(monthKey) || 0;
      monthMap.set(monthKey, currentValue + (Number(trade.net_pl) || 0));
    });
    
    // Convert map to array of objects
    return Array.from(monthMap.entries())
      .map(([key, value]) => {
        const [year, month] = key.split('-').map(Number);
        const date = new Date(year, month - 1);
        return {
          month: format(date, 'MMM yyyy'),
          pnl: value,
          key
        };
      })
      .sort((a, b) => {
        // Sort by date (implicit in the key format yyyy-mm)
        return a.key.localeCompare(b.key);
      });
  }, [trades]);

  // Calculate best, worst, and average monthly PnL
  const bestMonth = React.useMemo(() => {
    if (monthlyPnL.length === 0) return { month: 'N/A', pnl: 0 };
    return monthlyPnL.reduce((best, current) => 
      current.pnl > best.pnl ? current : best, { month: '', pnl: -Infinity });
  }, [monthlyPnL]);

  const worstMonth = React.useMemo(() => {
    if (monthlyPnL.length === 0) return { month: 'N/A', pnl: 0 };
    return monthlyPnL.reduce((worst, current) => 
      current.pnl < worst.pnl ? current : worst, { month: '', pnl: Infinity });
  }, [monthlyPnL]);

  const averageMonthlyPnL = React.useMemo(() => {
    if (monthlyPnL.length === 0) return 0;
    const total = monthlyPnL.reduce((sum, current) => sum + current.pnl, 0);
    return total / monthlyPnL.length;
  }, [monthlyPnL]);

  // Format currency based on user settings
  const formatCurrency = (value: number) => {
    return formatCurrencyValue(value, settings?.base_currency || 'USD');
  };

  // Format currency with K suffix for large numbers
  const formatCurrencyCompact = (value: number) => {
    const currency = getCurrencyByCode(settings?.base_currency || 'USD');
    const symbol = currency?.symbol || '$';
    
    if (Math.abs(value) >= 1000) {
      const kValue = value / 1000;
      return `${symbol}${kValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}K`;
    }
    
    return `${symbol}${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold mb-2">All Stats</h2>
        <p className="text-muted-foreground text-sm sm:text-base">{formatDateRange()}</p>
      </div>
      
      {/* All Overview Metrics - Responsive Grid: Single row on desktop, 2 rows (3 per row) on smaller screens */}
      <div className="grid grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3">
        <Card className="p-3">
          <CardHeader className="pb-1 px-0 pt-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Net P&L</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <p className={`text-sm sm:text-lg font-semibold ${overviewMetrics.netPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrencyCompact(overviewMetrics.netPnL)}
            </p>
          </CardContent>
        </Card>
        
        <Card className="p-3">
          <CardHeader className="pb-1 px-0 pt-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <p className={`text-sm sm:text-lg font-semibold ${overviewMetrics.winRate > 49 ? 'text-green-500' : 'text-red-500'}`}>
              {overviewMetrics.winRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        
        <Card className="p-3">
          <CardHeader className="pb-1 px-0 pt-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Avg Win/Loss</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm text-green-500 font-medium">
                Win: {formatCurrencyCompact(overviewMetrics.avgWin)}
              </p>
              <p className="text-xs sm:text-sm text-red-500 font-medium">
                Loss: {formatCurrencyCompact(overviewMetrics.avgLoss)}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="p-3">
          <CardHeader className="pb-1 px-0 pt-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Best Month</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <p className="text-sm sm:text-lg font-semibold text-green-500">{formatCurrencyCompact(bestMonth.pnl)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{bestMonth.month}</p>
          </CardContent>
        </Card>
        
        <Card className="p-3">
          <CardHeader className="pb-1 px-0 pt-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Worst Month</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <p className="text-sm sm:text-lg font-semibold text-red-500">{formatCurrencyCompact(worstMonth.pnl)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{worstMonth.month}</p>
          </CardContent>
        </Card>
        
        <Card className="p-3">
          <CardHeader className="pb-1 px-0 pt-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Avg/Month</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <p className={`text-sm sm:text-lg font-semibold ${averageMonthlyPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrencyCompact(averageMonthlyPnL)}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Performance Metrics */}
      <PerformanceMetrics trades={trades} settings={settings} />
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Net Cumulative P&L</CardTitle>
            <CardDescription>Cumulative profit and loss over time</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <CumulativePnLChart trades={trades} settings={settings} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Net Daily P&L</CardTitle>
            <CardDescription>Daily profit and loss fluctuations</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <NetDailyPnLChart trades={trades} dateRange={dateRange} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
