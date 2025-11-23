
import React, { useMemo } from 'react';
import { format, parseISO, getISOWeek, getYear } from "date-fns";
import { Trade } from "@/hooks/useTrades";
import { DateRange } from "@/components/filters/DateRangeTypes";
import { HorizontalBarChart } from "./HorizontalBarChart";
import { SummaryTable, SummaryTableColumn } from "./SummaryTable";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { formatCurrencyValue } from "@/lib/currency-data";

interface WeeksSectionProps {
  trades: Trade[];
  dateRange: DateRange;
  settings: any;
}

export function WeeksSection({ trades, dateRange, settings }: WeeksSectionProps) {
  const { settings: globalSettings } = useGlobalSettings();
  const baseCurrency = globalSettings?.base_currency || "USD";
  
  // Process trade data by week
  const weekStats = useMemo(() => {
    // Create a map to store stats by week
    const weekMap = new Map();
    
    // Aggregate trade data
    trades.forEach(trade => {
      if (!trade.entry_time || trade.net_pl === null || trade.net_pl === undefined) return;
      
      const date = parseISO(trade.entry_time);
      const year = getYear(date);
      const week = getISOWeek(date);
      const weekKey = `${year}-W${week.toString().padStart(2, '0')}`;
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          weekKey,
          year,
          week,
          netProfit: 0,
          totalProfit: 0,
          totalLoss: 0,
          count: 0
        });
      }
      
      const weekData = weekMap.get(weekKey);
      weekData.count += 1;
      weekData.netProfit += trade.net_pl;
      
      if (trade.net_pl > 0) {
        weekData.totalProfit += trade.net_pl;
      } else {
        weekData.totalLoss += trade.net_pl;
      }
    });
    
    // Convert map to array and sort by year and week
    return Array.from(weekMap.values())
      .sort((a, b) => a.year - b.year || a.week - b.week);
  }, [trades]);
  
  // Format data for distribution chart
  const distributionData = useMemo(() => {
    // Get the last 10 weeks for better visualization
    const lastWeeks = weekStats.slice(-10);
    return lastWeeks.map(week => ({
      name: `Week ${week.week}`,
      value: week.count,
    }));
  }, [weekStats]);
  
  // Format data for performance chart
  const performanceData = useMemo(() => {
    // Get the last 10 weeks for better visualization
    const lastWeeks = weekStats.slice(-10);
    return lastWeeks.map(week => ({
      name: `Week ${week.week}`,
      value: week.netProfit,
      count: week.count
    }));
  }, [weekStats]);
  
  // Format data for summary table
  const tableData = useMemo(() => {
    return weekStats.map(week => {
      const percentGain = week.netProfit !== 0 && week.count > 0 
        ? (week.netProfit / Math.abs(week.count)) * 100 
        : 0;
        
      return {
        week: `Week ${week.week} (${week.year})`,
        netProfit: week.netProfit,
        percentGain,
        totalProfit: week.totalProfit,
        totalLoss: Math.abs(week.totalLoss), // Convert to positive for display
        trades: week.count
      };
    });
  }, [weekStats]);
  
  // Table columns
  const columns: SummaryTableColumn[] = [
    { key: 'week', header: 'Week' },
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
          <CardTitle>Week Statistics</CardTitle>
          <CardDescription>
            Trading performance by week from {format(dateRange.from, "PPP")} to {format(dateRange.to, "PPP")}
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <HorizontalBarChart 
          data={distributionData}
          title="Trade Distribution by Week"
          description="Number of trades per week"
          valuePrefix=""
          valueSuffix=" trades"
        />
        
        <HorizontalBarChart 
          data={performanceData}
          title="Performance by Week"
          description="Net P&L per week"
        />
      </div>
      
      <SummaryTable 
        columns={columns}
        data={tableData}
      />
    </div>
  );
}
