
import React, { useMemo } from 'react';
import { Trade } from "@/types/trade";
import { GlobalSettings } from "@/hooks/useGlobalSettings";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { format, parse } from 'date-fns';
import { formatCurrencyValue } from "@/lib/currency-data";

interface CumulativePnLChartProps {
  trades: Trade[];
  settings: GlobalSettings | null;
}

export const CumulativePnLChart: React.FC<CumulativePnLChartProps> = ({ trades, settings }) => {
  const chartData = useMemo(() => {
    if (!trades.length) return [];

    // Get all trade dates and sort them
    const dateMap = new Map<string, number>();
    
    // Get all dates with trades
    trades.forEach(trade => {
      if (!trade.entry_time || trade.net_pl === undefined || trade.net_pl === null) return;
      
      const date = format(new Date(trade.entry_time), 'yyyy-MM-dd');
      const currentValue = dateMap.get(date) || 0;
      dateMap.set(date, currentValue + Number(trade.net_pl));
    });
    
    // Sort dates
    const sortedDates = Array.from(dateMap.keys()).sort();
    
    // Calculate cumulative P&L
    let cumulativePnL = 0;
    return sortedDates.map(date => {
      const dailyPnL = dateMap.get(date) || 0;
      cumulativePnL += dailyPnL;
      
      return {
        date,
        pnl: cumulativePnL,
        // Format date for display
        displayDate: format(parse(date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy')
      };
    });
  }, [trades]);

  // Format currency based on user settings
  const formatCurrency = (value: number) => {
    const currency = settings?.base_currency || 'USD';
    return formatCurrencyValue(value, currency);
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-start h-full">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="displayDate" 
            tick={{ fontSize: 12 }} 
            tickFormatter={(value) => {
              // Only show few dates for readability
              if (chartData.length <= 10 || chartData.indexOf(value) % Math.ceil(chartData.length / 5) === 0) {
                return format(new Date(value), 'MMM d');
              }
              return '';
            }}
            className="text-xs text-muted-foreground"
          />
          <YAxis 
            tickFormatter={(value) => formatCurrency(value).replace(/[^\d.-]/g, '')}
            className="text-xs text-muted-foreground"
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), 'Cumulative P&L']}
            labelFormatter={(label) => `Date: ${label}`}
            contentStyle={{
              backgroundColor: 'var(--background)',
              borderColor: 'var(--border)',
              borderRadius: '0.5rem',
            }}
          />
          <Area 
            type="monotone" 
            dataKey="pnl" 
            stroke="hsl(var(--primary))" 
            fill="hsl(var(--primary))" 
            fillOpacity={0.2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
