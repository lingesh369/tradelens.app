
import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import { formatCurrencyValue } from '@/lib/currency-data';

interface TradePnLBadgeProps {
  pnl: number;
  pnlPercent: number;
}

export function TradePnLBadge({ pnl, pnlPercent }: TradePnLBadgeProps) {
  const { settings } = useGlobalSettings();
  const isPositive = pnl > 0;
  const isNegative = pnl < 0;
  
  if (pnl === 0) {
    return null; // Don't show badge for break-even trades
  }

  const formatPnL = () => {
    const formattedAmount = formatCurrencyValue(Math.abs(pnl), settings?.base_currency || "USD");
    return `${pnl < 0 ? '-' : ''}${formattedAmount}`;
  };

  const formatPercentage = () => {
    return `${pnlPercent > 0 ? '+' : ''}${pnlPercent.toFixed(2)}%`;
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-sm font-medium",
      isPositive && "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800/30",
      isNegative && "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/30"
    )}>
      {isPositive && <ArrowUp className="h-3 w-3" />}
      {isNegative && <ArrowDown className="h-3 w-3" />}
      <span className="whitespace-nowrap">
        {formatPnL()} | {formatPercentage()}
      </span>
    </div>
  );
}
