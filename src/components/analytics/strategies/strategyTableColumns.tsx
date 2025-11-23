
import React from 'react';
import { SummaryTableColumn } from "@/components/analytics/SummaryTable";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { formatCurrencyValue } from "@/lib/currency-data";

export const getStrategyTableColumns = (): SummaryTableColumn[] => {
  const { settings } = useGlobalSettings();
  const baseCurrency = settings?.base_currency || "USD";
  
  return [
    { key: 'strategy', header: 'Strategy' },
    { 
      key: 'netProfit', 
      header: 'Net Profit', 
      className: 'text-right',
      format: (value) => (
        <span className={value >= 0 ? 'text-[hsl(var(--profit))]' : 'text-[hsl(var(--loss))]'}>
          {value >= 0 ? '+' : ''}{formatCurrencyValue(Math.abs(value), baseCurrency)}
        </span>
      )
    },
    { 
      key: 'winRate', 
      header: 'Win Rate', 
      className: 'text-right',
      format: (value) => `${value.toFixed(1)}%`
    },
    { 
      key: 'expectancy', 
      header: 'Expectancy', 
      className: 'text-right',
      format: (value) => (
        <span className={value >= 0 ? 'text-[hsl(var(--profit))]' : 'text-[hsl(var(--loss))]'}>
          {value >= 0 ? '+' : ''}{formatCurrencyValue(Math.abs(value), baseCurrency)}
        </span>
      )
    },
    { 
      key: 'avgRMultiple', 
      header: 'Avg R', 
      className: 'text-right',
      format: (value) => (
        <span className={value >= 0 ? 'text-[hsl(var(--profit))]' : 'text-[hsl(var(--loss))]'}>
          {value.toFixed(2)}R
        </span>
      )
    },
    { 
      key: 'trades', 
      header: 'Trades', 
      className: 'text-right' 
    }
  ];
};
