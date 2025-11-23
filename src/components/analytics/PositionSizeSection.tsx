import React, { useMemo, useState } from 'react';
import { format } from "date-fns";
import { Trade } from "@/hooks/useTrades";
import { DateRange } from "@/components/filters/DateRangeTypes";
import { HorizontalBarChart } from "./HorizontalBarChart";
import { SummaryTable, SummaryTableColumn } from "./SummaryTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { formatCurrencyValue } from "@/lib/currency-data";

interface PositionSizeSectionProps {
  trades: Trade[];
  dateRange: DateRange;
  settings: any;
}

export function PositionSizeSection({ trades, dateRange, settings }: PositionSizeSectionProps) {
  const [positionSizeRanges, setPositionSizeRanges] = useState<Array<{min: number, max: number, label: string}>>([]);
  const { settings: globalSettings } = useGlobalSettings();
  const baseCurrency = globalSettings?.base_currency || "USD";
  
  // Dynamically calculate position size ranges based on trade data
  useMemo(() => {
    if (!trades.length) return;
    
    // Find min and max position sizes
    const positionSizes = trades
      .filter(t => t.quantity && t.entry_price)
      .map(t => t.quantity * t.entry_price);
    
    if (!positionSizes.length) return;
    
    const maxSize = Math.max(...positionSizes);
    
    // Create ranges - we'll create 8 ranges from smallest to largest
    const step = maxSize / 8;
    const ranges = [];
    
    for (let i = 0; i < 8; i++) {
      const min = i * step;
      const max = (i + 1) * step;
      let label = '';
      
      // Format labels nicely
      if (i === 7) {
        label = `$${Math.floor(min).toLocaleString()} and above`;
      } else {
        label = `$${Math.floor(min).toLocaleString()} to $${Math.floor(max).toLocaleString()}`;
      }
      
      ranges.push({ min, max, label });
    }
    
    setPositionSizeRanges(ranges);
  }, [trades]);
  
  // Process trade data by position size ranges
  const positionSizeStats = useMemo(() => {
    if (!trades.length || !positionSizeRanges.length) return [];
    
    // Group trades by position size range
    const rangeMap = new Map<string, {
      range: string,
      netProfit: number,
      totalProfit: number,
      totalLoss: number,
      count: number,
      winCount: number,
      lossCount: number,
      percentGain: number
    }>();
    
    // Initialize map with all position size ranges
    positionSizeRanges.forEach(range => {
      rangeMap.set(range.label, {
        range: range.label,
        netProfit: 0,
        totalProfit: 0,
        totalLoss: 0,
        count: 0,
        winCount: 0,
        lossCount: 0,
        percentGain: 0
      });
    });
    
    // Process trades
    trades.forEach(trade => {
      if (!trade.quantity || !trade.entry_price || trade.net_pl === null) return;
      
      // Calculate position size
      const positionSize = trade.quantity * trade.entry_price;
      
      // Find the appropriate range for this trade's position size
      const range = positionSizeRanges.find(r => 
        positionSize >= r.min && (positionSize < r.max || (r === positionSizeRanges[positionSizeRanges.length - 1]))
      );
      
      if (!range) return;
      
      const stats = rangeMap.get(range.label);
      if (!stats) return;
      
      stats.count += 1;
      stats.netProfit += trade.net_pl;
      
      if (trade.net_pl > 0) {
        stats.totalProfit += trade.net_pl;
        stats.winCount += 1;
      } else {
        stats.totalLoss += trade.net_pl;
        stats.lossCount += 1;
      }
      
      rangeMap.set(range.label, stats);
    });
    
    // Calculate percent gain for each range
    rangeMap.forEach(stats => {
      if (stats.count > 0) {
        stats.percentGain = (stats.netProfit / Math.abs(stats.totalLoss || 1)) * 100;
      }
    });
    
    // Convert map to array
    let statsArray = Array.from(rangeMap.values())
      .filter(s => s.count > 0); // Only include ranges with trades
    
    // Sort by position size (lowest to highest)
    statsArray.sort((a, b) => {
      const aIndex = positionSizeRanges.findIndex(r => r.label === a.range);
      const bIndex = positionSizeRanges.findIndex(r => r.label === b.range);
      return aIndex - bIndex;
    });
    
    return statsArray;
  }, [trades, positionSizeRanges]);
  
  // Format data for distribution chart
  const distributionData = useMemo(() => {
    return positionSizeStats.map(range => ({
      name: range.range,
      value: range.count,
    }));
  }, [positionSizeStats]);
  
  // Format data for performance chart
  const performanceData = useMemo(() => {
    return positionSizeStats.map(range => ({
      name: range.range,
      value: range.netProfit,
      count: range.count
    }));
  }, [positionSizeStats]);
  
  // Format data for summary table
  const tableData = useMemo(() => {
    return positionSizeStats.map(range => {
      return {
        range: range.range,
        netProfit: range.netProfit,
        percentGain: range.percentGain,
        totalProfit: range.totalProfit,
        totalLoss: Math.abs(range.totalLoss), // Convert to positive for display
        trades: range.count
      };
    });
  }, [positionSizeStats]);
  
  // Table columns
  const columns: SummaryTableColumn[] = [
    { key: 'range', header: 'Position Size Range' },
    { 
      key: 'netProfit', 
      header: 'Net Profits', 
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
      header: 'Total Profits', 
      className: 'text-right',
      format: (value) => <span className="text-[hsl(var(--profit))]">{formatCurrencyValue(value, baseCurrency)}</span>
    },
    { 
      key: 'totalLoss', 
      header: 'Total Loss', 
      className: 'text-right',
      format: (value) => <span className="text-[hsl(var(--loss))]">{formatCurrencyValue(value, baseCurrency)}</span>
    },
    { 
      key: 'trades', 
      header: 'Trades', 
      className: 'text-right' 
    }
  ];

  const noDataContent = (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
      <p className="text-lg font-medium mb-1">No data available</p>
      <p className="text-sm max-w-md text-center">
        There is no position size data available for the selected date range.
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="border rounded-lg shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 py-4">
          <div>
            <CardTitle className="text-xl font-semibold leading-7">Trade Distribution by Position Size</CardTitle>
            <CardDescription className="text-sm mt-1 leading-6">
              Trading performance by position size from {format(dateRange.from, "PP")} to {format(dateRange.to, "PP")}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
      
      {positionSizeStats.length > 0 ? (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            <HorizontalBarChart 
              data={distributionData}
              title="Trade Distribution by Position Size"
              description="Number of trades per position size range"
              valuePrefix=""
              valueSuffix=" trades"
            />
            
            <HorizontalBarChart 
              data={performanceData}
              title="Performance by Position Size"
              description="Net P&L per position size range"
            />
          </div>
          
          <SummaryTable 
            columns={columns}
            data={tableData}
          />
        </>
      ) : noDataContent}
    </div>
  );
}
