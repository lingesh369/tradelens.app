
import React, { useMemo } from 'react';
import { format, parseISO, getHours } from "date-fns";
import { Trade } from "@/hooks/useTrades";
import { DateRange } from "@/components/filters/DateRangeTypes";
import { HorizontalBarChart } from "./HorizontalBarChart";
import { SummaryTable, SummaryTableColumn } from "./SummaryTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { formatCurrencyValue } from "@/lib/currency-data";

interface TradeTimeSectionProps {
  trades: Trade[];
  dateRange: DateRange;
  settings: any;
}

export function TradeTimeSection({ trades, dateRange, settings }: TradeTimeSectionProps) {
  const { settings: globalSettings } = useGlobalSettings();
  const baseCurrency = globalSettings?.base_currency || "USD";
  
  // Process trade data by hour
  const hourStats = useMemo(() => {
    // Initialize stats for each hour (0-23)
    const stats = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      hourFormatted: format(new Date().setHours(hour, 0, 0, 0), 'h:00 a'),
      netProfit: 0,
      totalProfit: 0,
      totalLoss: 0,
      count: 0
    }));
    
    // Aggregate trade data
    trades.forEach(trade => {
      if (!trade.entry_time || trade.net_pl === null || trade.net_pl === undefined) return;
      
      const date = parseISO(trade.entry_time);
      const hourIndex = getHours(date);
      
      stats[hourIndex].count += 1;
      stats[hourIndex].netProfit += trade.net_pl;
      
      if (trade.net_pl > 0) {
        stats[hourIndex].totalProfit += trade.net_pl;
      } else {
        stats[hourIndex].totalLoss += trade.net_pl;
      }
    });
    
    return stats;
  }, [trades]);
  
  // Format data for distribution chart
  const distributionData = useMemo(() => {
    return hourStats.map(hour => ({
      name: hour.hourFormatted,
      value: hour.count,
    }));
  }, [hourStats]);
  
  // Format data for performance chart
  const performanceData = useMemo(() => {
    return hourStats.map(hour => ({
      name: hour.hourFormatted,
      value: hour.netProfit,
      count: hour.count
    }));
  }, [hourStats]);
  
  // Format data for summary table
  const tableData = useMemo(() => {
    return hourStats.map(hour => {
      const percentGain = hour.netProfit !== 0 && hour.count > 0 
        ? (hour.netProfit / Math.abs(hour.count)) * 100 
        : 0;
        
      return {
        hour: hour.hourFormatted,
        netProfit: hour.netProfit,
        percentGain,
        totalProfit: hour.totalProfit,
        totalLoss: Math.abs(hour.totalLoss), // Convert to positive for display
        trades: hour.count
      };
    });
  }, [hourStats]);
  
  // Table columns
  const columns: SummaryTableColumn[] = [
    { key: 'hour', header: 'Hour' },
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
      key: 'percentGain', 
      header: '% Gain', 
      className: 'text-right',
      format: (value) => (
        <span className={value >= 0 ? 'text-[hsl(var(--profit))]' : 'text-[hsl(var(--loss))]'}>
          {value >= 0 ? '+' : ''}{value.toFixed(2)}%
        </span>
      )
    },
    { 
      key: 'totalProfit', 
      header: 'Total Profit', 
      className: 'text-right',
      format: (value) => <span className="text-[hsl(var(--profit))]">{formatCurrencyValue(value, baseCurrency)}</span>
    },
    { 
      key: 'totalLoss', 
      header: 'Total Loss', 
      className: 'text-right',
      format: (value) => <span className="text-[hsl(var(--loss))]">{formatCurrencyValue(value, baseCurrency)}</span>
    },
    { key: 'trades', header: 'Trades', className: 'text-right' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Trade Time Statistics</CardTitle>
          <CardDescription>
            Trading performance by time of day from {format(dateRange.from, "PPP")} to {format(dateRange.to, "PPP")}
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <HorizontalBarChart 
          data={distributionData}
          title="Trade Distribution by Hour"
          description="Number of trades per hour"
          valuePrefix=""
          valueSuffix=" trades"
        />
        
        <HorizontalBarChart 
          data={performanceData}
          title="Performance by Hour"
          description="Net P&L per hour"
        />
      </div>
      
      <SummaryTable 
        columns={columns}
        data={tableData}
      />
    </div>
  );
}
