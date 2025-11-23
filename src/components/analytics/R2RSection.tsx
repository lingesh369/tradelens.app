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

interface R2RSectionProps {
  trades: Trade[];
  dateRange: DateRange;
  settings: any;
}

// Define R2R ranges
const R2R_RANGES = [
  { min: 4, max: Infinity, label: '+4R and above' },
  { min: 2, max: 3.99, label: '+2R to 3.99R' },
  { min: 1, max: 1.99, label: '+1R to 1.99R' },
  { min: 0, max: 0.99, label: '0R to 0.99R' },
  { min: -0.99, max: -0.01, label: '-0.01R to -0.99R' },
  { min: -1.99, max: -1, label: '-1R to -1.99R' },
  { min: -3.99, max: -2, label: '-2R to -3.99R' },
  { min: -Infinity, max: -4, label: '-4R and below' },
];

export function R2RSection({ trades, dateRange, settings }: R2RSectionProps) {
  const { settings: globalSettings } = useGlobalSettings();
  const baseCurrency = globalSettings?.base_currency || "USD";
  
  // Process trade data by R2R ranges
  const r2rStats = useMemo(() => {
    // Group trades by R2R range
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
    
    // Initialize map with all R2R ranges
    R2R_RANGES.forEach(range => {
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
      if (trade.r2r === undefined || trade.r2r === null || trade.net_pl === null) return;
      
      // Find the appropriate range for this trade's R2R value
      const r2rValue = trade.r2r;
      const range = R2R_RANGES.find(r => r2rValue >= r.min && r2rValue <= r.max);
      
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
    
    // Convert map to array and sort by R2R range (not by performance)
    // For R2R, we want to maintain the logical order of the ranges
    let statsArray = Array.from(rangeMap.values())
      .filter(s => s.count > 0); // Only include ranges with trades
    
    // Sort by the original R2R_RANGES order
    statsArray.sort((a, b) => {
      const aIndex = R2R_RANGES.findIndex(r => r.label === a.range);
      const bIndex = R2R_RANGES.findIndex(r => r.label === b.range);
      return aIndex - bIndex;
    });
    
    return statsArray;
  }, [trades]);
  
  // Format data for distribution chart
  const distributionData = useMemo(() => {
    return r2rStats.map(r2r => ({
      name: r2r.range,
      value: r2r.count,
    }));
  }, [r2rStats]);
  
  // Format data for performance chart
  const performanceData = useMemo(() => {
    return r2rStats.map(r2r => ({
      name: r2r.range,
      value: r2r.netProfit,
      count: r2r.count
    }));
  }, [r2rStats]);
  
  // Format data for summary table
  const tableData = useMemo(() => {
    return r2rStats.map(r2r => {
      return {
        range: r2r.range,
        netProfit: r2r.netProfit,
        percentGain: r2r.percentGain,
        totalProfit: r2r.totalProfit,
        totalLoss: Math.abs(r2r.totalLoss), // Convert to positive for display
        trades: r2r.count
      };
    });
  }, [r2rStats]);
  
  // Table columns
  const columns: SummaryTableColumn[] = [
    { key: 'range', header: 'R2R Range' },
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
        There is no R2R data available for the selected date range. Make sure you've set stop loss values for your trades.
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="border rounded-lg shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 py-4">
          <div>
            <CardTitle className="text-xl font-semibold leading-7">Trade Distribution by R2R</CardTitle>
            <CardDescription className="text-sm mt-1 leading-6">
              Trading performance by risk-to-reward ratio from {format(dateRange.from, "PP")} to {format(dateRange.to, "PP")}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
      
      {r2rStats.length > 0 ? (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            <HorizontalBarChart 
              data={distributionData}
              title="Trade Distribution by R2R"
              description="Number of trades per R2R range"
              valuePrefix=""
              valueSuffix=" trades"
            />
            
            <HorizontalBarChart 
              data={performanceData}
              title="Performance by R2R"
              description="Net P&L per R2R range"
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
