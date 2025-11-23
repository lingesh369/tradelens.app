
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { formatCurrencyValue } from "@/lib/currency-data";

interface StrategyMetricsCardProps {
  netPL: number;
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  avgWinner: number;
  avgLoser: number;
  largestProfit: number;
  largestLoss: number;
  totalR2R: number;
  isLoading?: boolean;
}

export function StrategyMetricsCard({
  netPL = 0,
  totalTrades = 0,
  winRate = 0,
  profitFactor = 0,
  avgWinner = 0,
  avgLoser = 0,
  largestProfit = 0,
  largestLoss = 0,
  totalR2R = 0,
  isLoading = false
}: StrategyMetricsCardProps) {
  const { settings } = useGlobalSettings();
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Strategy Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array(9).fill(0).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format currency with 2 decimal places
  const formatCurrency = (value: number) => {
    return formatCurrencyValue(value, settings?.base_currency || "USD");
  };

  // Format numbers with 2 decimal places
  const formatNumber = (value: number) => {
    return value.toFixed(2);
  };

  const metrics = [
    { label: 'Net P&L', value: formatCurrency(netPL), color: netPL >= 0 ? 'text-green-500' : 'text-red-500' },
    { label: 'Total Trades', value: totalTrades.toString() },
    { label: 'Win Rate', value: `${formatNumber(winRate)}%` },
    { label: 'Profit Factor', value: formatNumber(profitFactor) },
    { label: 'Avg Winner', value: formatCurrency(avgWinner), color: 'text-green-500' },
    { label: 'Avg Loser', value: formatCurrency(avgLoser), color: 'text-red-500' },
    { label: 'Largest Profit', value: formatCurrency(largestProfit), color: 'text-green-500' },
    { label: 'Largest Loss', value: formatCurrency(Math.abs(largestLoss)), color: 'text-red-500' },
    { label: 'Total R2R', value: formatNumber(totalR2R) },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Strategy Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {metrics.map((metric, index) => (
            <div key={index} className="space-y-1">
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <p className={`text-lg font-medium ${metric.color || ''}`}>
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
