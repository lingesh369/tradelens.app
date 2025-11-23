
import React, { useMemo } from 'react';
import { format, parseISO, differenceInMinutes } from "date-fns";
import { Trade } from "@/hooks/useTrades";
import { DateRange } from "@/components/filters/DateRangeTypes";
import { HorizontalBarChart } from "./HorizontalBarChart";
import { SummaryTable, SummaryTableColumn } from "./SummaryTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { formatCurrencyValue } from "@/lib/currency-data";

interface TradeDurationSectionProps {
  trades: Trade[];
  dateRange: DateRange;
  settings: any;
}

// Define duration ranges for grouping
const DURATION_RANGES = [
  { key: 'under1min', label: 'Under 1 min', min: 0, max: 1 },
  { key: '1to5min', label: '1 to 5 mins', min: 1, max: 5 },
  { key: '5to15min', label: '5 to 15 mins', min: 5, max: 15 },
  { key: '15to30min', label: '15 to 30 mins', min: 15, max: 30 },
  { key: '30to60min', label: '30 to 60 mins', min: 30, max: 60 },
  { key: '1to2hours', label: '1 to 2 hours', min: 60, max: 120 },
  { key: '2to4hours', label: '2 to 4 hours', min: 120, max: 240 },
  { key: 'over4hours', label: 'Over 4 hours', min: 240, max: Infinity }
];

export function TradeDurationSection({ trades, dateRange, settings }: TradeDurationSectionProps) {
  const { settings: globalSettings } = useGlobalSettings();
  const baseCurrency = globalSettings?.base_currency || "USD";
  
  // Process trade data by duration
  const durationStats = useMemo(() => {
    // Initialize stats for each duration range
    const stats = DURATION_RANGES.map(range => ({
      ...range,
      netProfit: 0,
      totalProfit: 0,
      totalLoss: 0,
      count: 0
    }));
    
    // Aggregate trade data
    trades.forEach(trade => {
      if (!trade.entry_time || !trade.exit_time || trade.net_pl === null || trade.net_pl === undefined) return;
      
      const entryDate = parseISO(trade.entry_time);
      const exitDate = parseISO(trade.exit_time);
      const durationMinutes = differenceInMinutes(exitDate, entryDate);
      
      // Find the appropriate duration range
      const rangeIndex = stats.findIndex(range => 
        durationMinutes >= range.min && durationMinutes < range.max
      );
      
      if (rangeIndex >= 0) {
        stats[rangeIndex].count += 1;
        stats[rangeIndex].netProfit += trade.net_pl;
        
        if (trade.net_pl > 0) {
          stats[rangeIndex].totalProfit += trade.net_pl;
        } else {
          stats[rangeIndex].totalLoss += trade.net_pl;
        }
      }
    });
    
    return stats;
  }, [trades]);
  
  // Format data for distribution chart
  const distributionData = useMemo(() => {
    return durationStats.map(duration => ({
      name: duration.label,
      value: duration.count,
    }));
  }, [durationStats]);
  
  // Format data for performance chart
  const performanceData = useMemo(() => {
    return durationStats.map(duration => ({
      name: duration.label,
      value: duration.netProfit,
      count: duration.count
    }));
  }, [durationStats]);
  
  // Format data for summary table
  const tableData = useMemo(() => {
    return durationStats.map(duration => {
      const percentGain = duration.netProfit !== 0 && duration.count > 0 
        ? (duration.netProfit / Math.abs(duration.count)) * 100 
        : 0;
        
      return {
        duration: duration.label,
        netProfit: duration.netProfit,
        percentGain,
        totalProfit: duration.totalProfit,
        totalLoss: Math.abs(duration.totalLoss), // Convert to positive for display
        trades: duration.count
      };
    });
  }, [durationStats]);
  
  // Table columns
  const columns: SummaryTableColumn[] = [
    { key: 'duration', header: 'Duration' },
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
          <CardTitle>Trade Duration Statistics</CardTitle>
          <CardDescription>
            Trading performance by trade duration from {format(dateRange.from, "PPP")} to {format(dateRange.to, "PPP")}
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <HorizontalBarChart 
          data={distributionData}
          title="Trade Distribution by Duration"
          description="Number of trades per duration range"
          valuePrefix=""
          valueSuffix=" trades"
        />
        
        <HorizontalBarChart 
          data={performanceData}
          title="Performance by Duration"
          description="Net P&L per duration range"
        />
      </div>
      
      <SummaryTable 
        columns={columns}
        data={tableData}
      />
    </div>
  );
}
