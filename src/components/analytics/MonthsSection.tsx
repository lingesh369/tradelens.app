
import React, { useMemo } from 'react';
import { format, parseISO, getMonth, getYear } from "date-fns";
import { Trade } from "@/hooks/useTrades";
import { DateRange } from "@/components/filters/DateRangeTypes";
import { HorizontalBarChart } from "./HorizontalBarChart";
import { SummaryTable, SummaryTableColumn } from "./SummaryTable";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { formatCurrencyValue } from "@/lib/currency-data";

interface MonthsSectionProps {
  trades: Trade[];
  dateRange: DateRange;
  settings: any;
}

export function MonthsSection({ trades, dateRange, settings }: MonthsSectionProps) {
  const { settings: globalSettings } = useGlobalSettings();
  const baseCurrency = globalSettings?.base_currency || "USD";
  
  // Array of month names
  const monthNames = ["January", "February", "March", "April", "May", "June", 
                      "July", "August", "September", "October", "November", "December"];

  // Process trade data by month
  const monthStats = useMemo(() => {
    // Create a map to store stats by month
    const monthMap = new Map();
    
    // Aggregate trade data
    trades.forEach(trade => {
      if (!trade.entry_time || trade.net_pl === null || trade.net_pl === undefined) return;
      
      const date = parseISO(trade.entry_time);
      const year = getYear(date);
      const month = getMonth(date);
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          monthKey,
          year,
          month,
          monthName: monthNames[month],
          netProfit: 0,
          totalProfit: 0,
          totalLoss: 0,
          count: 0
        });
      }
      
      const monthData = monthMap.get(monthKey);
      monthData.count += 1;
      monthData.netProfit += trade.net_pl;
      
      if (trade.net_pl > 0) {
        monthData.totalProfit += trade.net_pl;
      } else {
        monthData.totalLoss += trade.net_pl;
      }
    });
    
    // Convert map to array and sort by year and month
    return Array.from(monthMap.values())
      .sort((a, b) => a.year - b.year || a.month - b.month);
  }, [trades]);
  
  // Format data for distribution chart
  const distributionData = useMemo(() => {
    // Get the last 12 months for better visualization
    const lastMonths = monthStats.slice(-12);
    return lastMonths.map(month => ({
      name: month.monthName,
      value: month.count,
    }));
  }, [monthStats]);
  
  // Format data for performance chart
  const performanceData = useMemo(() => {
    // Get the last 12 months for better visualization
    const lastMonths = monthStats.slice(-12);
    return lastMonths.map(month => ({
      name: month.monthName,
      value: month.netProfit,
      count: month.count
    }));
  }, [monthStats]);
  
  // Format data for summary table
  const tableData = useMemo(() => {
    return monthStats.map(month => {
      const percentGain = month.netProfit !== 0 && month.count > 0 
        ? (month.netProfit / Math.abs(month.count)) * 100 
        : 0;
        
      return {
        month: `${month.monthName} ${month.year}`,
        netProfit: month.netProfit,
        percentGain,
        totalProfit: month.totalProfit,
        totalLoss: Math.abs(month.totalLoss), // Convert to positive for display
        trades: month.count
      };
    });
  }, [monthStats]);
  
  // Table columns
  const columns: SummaryTableColumn[] = [
    { key: 'month', header: 'Month' },
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
          <CardTitle>Month Statistics</CardTitle>
          <CardDescription>
            Trading performance by month from {format(dateRange.from, "PPP")} to {format(dateRange.to, "PPP")}
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <HorizontalBarChart 
          data={distributionData}
          title="Trade Distribution by Month"
          description="Number of trades per month"
          valuePrefix=""
          valueSuffix=" trades"
        />
        
        <HorizontalBarChart 
          data={performanceData}
          title="Performance by Month"
          description="Net P&L per month"
        />
      </div>
      
      <SummaryTable 
        columns={columns}
        data={tableData}
      />
    </div>
  );
}
