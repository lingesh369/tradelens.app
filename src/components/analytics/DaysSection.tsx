
import React, { useMemo } from 'react';
import { format, parseISO, getDay } from "date-fns";
import { Trade } from "@/hooks/useTrades";
import { DateRange } from "@/components/filters/DateRangeTypes";
import { HorizontalBarChart } from "./HorizontalBarChart";
import { SummaryTable, SummaryTableColumn } from "./SummaryTable";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { formatCurrencyValue } from "@/lib/currency-data";

interface DaysSectionProps {
  trades: Trade[];
  dateRange: DateRange;
  settings: any;
}

export function DaysSection({ trades, dateRange, settings }: DaysSectionProps) {
  const { settings: globalSettings } = useGlobalSettings();
  const baseCurrency = globalSettings?.base_currency || "USD";
  
  // Process trade data by day of week
  const dayStats = useMemo(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    // Initialize stats for each day
    const stats = days.map(day => ({
      name: day,
      netProfit: 0,
      totalProfit: 0,
      totalLoss: 0,
      count: 0
    }));
    
    // Aggregate trade data
    trades.forEach(trade => {
      if (!trade.entry_time || trade.net_pl === null || trade.net_pl === undefined) return;
      
      const date = parseISO(trade.entry_time);
      const dayIndex = getDay(date);
      
      stats[dayIndex].count += 1;
      stats[dayIndex].netProfit += trade.net_pl;
      
      if (trade.net_pl > 0) {
        stats[dayIndex].totalProfit += trade.net_pl;
      } else {
        stats[dayIndex].totalLoss += trade.net_pl;
      }
    });
    
    return stats;
  }, [trades]);
  
  // Format data for distribution chart
  const distributionData = useMemo(() => {
    return dayStats.map(day => ({
      name: day.name,
      value: day.count,
    }));
  }, [dayStats]);
  
  // Format data for performance chart
  const performanceData = useMemo(() => {
    return dayStats.map(day => ({
      name: day.name,
      value: day.netProfit,
      count: day.count
    }));
  }, [dayStats]);
  
  // Format data for summary table
  const tableData = useMemo(() => {
    return dayStats.map(day => {
      const percentGain = day.netProfit !== 0 && day.count > 0 
        ? (day.netProfit / Math.abs(day.count)) * 100 
        : 0;
        
      return {
        day: day.name,
        netProfit: day.netProfit,
        percentGain,
        totalProfit: day.totalProfit,
        totalLoss: Math.abs(day.totalLoss), // Convert to positive for display
        trades: day.count
      };
    });
  }, [dayStats]);
  
  // Table columns
  const columns: SummaryTableColumn[] = [
    { key: 'day', header: 'Day' },
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
          <CardTitle>Day Statistics</CardTitle>
          <CardDescription>
            Trading performance by day of the week from {format(dateRange.from, "PPP")} to {format(dateRange.to, "PPP")}
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <HorizontalBarChart 
          data={distributionData}
          title="Trade Distribution by Day of Week"
          description="Number of trades per day"
          valuePrefix=""
          valueSuffix=" trades"
        />
        
        <HorizontalBarChart 
          data={performanceData}
          title="Performance by Day of Week"
          description="Net P&L per day"
        />
      </div>
      
      <SummaryTable 
        columns={columns}
        data={tableData}
      />
    </div>
  );
}
