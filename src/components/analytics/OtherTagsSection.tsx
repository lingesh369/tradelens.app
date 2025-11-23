
import React, { useMemo, useState } from 'react';
import { format } from "date-fns";
import { Trade } from "@/hooks/useTrades";
import { DateRange } from "@/components/filters/DateRangeTypes";
import { HorizontalBarChart } from "./HorizontalBarChart";
import { SummaryTable, SummaryTableColumn } from "./SummaryTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { useTags } from "@/hooks/useTags";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { formatCurrencyValue } from "@/lib/currency-data";

interface OtherTagsSectionProps {
  trades: Trade[];
  dateRange: DateRange;
  settings: any;
}

type FilterOption = 'top5' | 'top10' | 'all';

export function OtherTagsSection({ trades, dateRange, settings }: OtherTagsSectionProps) {
  const [filter, setFilter] = useState<FilterOption>('top10');
  const { tags } = useTags();
  const { settings: globalSettings } = useGlobalSettings();
  const baseCurrency = globalSettings?.base_currency || "USD";
  
  // Get other tags (not mistake tags, using correct capitalization)
  const otherTags = useMemo(() => {
    return tags.filter(tag => tag.tag_type === 'Other');
  }, [tags]);

  // Process trade data by other tags using actual trade-tag relationships
  const otherTagStats = useMemo(() => {
    if (!trades.length || !otherTags.length) return [];
    
    const tagMap = new Map<string, {
      tagName: string,
      netProfit: number,
      totalProfit: number,
      totalLoss: number,
      count: number,
      winCount: number,
      lossCount: number,
      percentGain: number
    }>();
    
    // Initialize map with all other tags
    otherTags.forEach(tag => {
      tagMap.set(tag.tag_id, {
        tagName: tag.tag_name,
        netProfit: 0,
        totalProfit: 0,
        totalLoss: 0,
        count: 0,
        winCount: 0,
        lossCount: 0,
        percentGain: 0
      });
    });
    
    // Process each trade and match with other tags
    trades.forEach(trade => {
      if (!trade.net_pl) return;
      
      // Parse trade tags
      let tradeTags = [];
      if (trade.tags) {
        try {
          if (typeof trade.tags === 'string') {
            tradeTags = JSON.parse(trade.tags);
          } else if (Array.isArray(trade.tags)) {
            tradeTags = trade.tags;
          }
        } catch (e) {
          console.error('Error parsing trade tags:', e);
          tradeTags = [];
        }
      }
      
      // Check if any of the trade's tags are other tags
      tradeTags.forEach(tagId => {
        const otherTag = otherTags.find(tag => tag.tag_id === tagId);
        if (otherTag) {
          const stats = tagMap.get(tagId);
          if (stats) {
            stats.count += 1;
            stats.netProfit += trade.net_pl;
            
            if (trade.net_pl > 0) {
              stats.totalProfit += trade.net_pl;
              stats.winCount += 1;
            } else {
              stats.totalLoss += trade.net_pl;
              stats.lossCount += 1;
            }
            
            tagMap.set(tagId, stats);
          }
        }
      });
    });
    
    // Calculate percent gain for each tag
    tagMap.forEach(stats => {
      if (stats.count > 0) {
        stats.percentGain = stats.totalLoss !== 0 ? (stats.netProfit / Math.abs(stats.totalLoss)) * 100 : 0;
      }
    });
    
    // Convert map to array and sort by net profit
    const statsArray = Array.from(tagMap.values())
      .filter(s => s.count > 0) // Only include tags with trades
      .sort((a, b) => Math.abs(b.netProfit) - Math.abs(a.netProfit));
    
    return statsArray;
  }, [trades, otherTags]);
  
  // Apply filter to get top other tags
  const filteredOtherTagStats = useMemo(() => {
    if (filter === 'top5') return otherTagStats.slice(0, 5);
    if (filter === 'top10') return otherTagStats.slice(0, 10);
    return otherTagStats;
  }, [otherTagStats, filter]);
  
  // Format data for distribution chart
  const distributionData = useMemo(() => {
    return filteredOtherTagStats.map(tag => ({
      name: tag.tagName,
      value: tag.count,
    }));
  }, [filteredOtherTagStats]);
  
  // Format data for performance chart
  const performanceData = useMemo(() => {
    return filteredOtherTagStats.map(tag => ({
      name: tag.tagName,
      value: tag.netProfit,
      count: tag.count
    }));
  }, [filteredOtherTagStats]);
  
  // Format data for summary table
  const tableData = useMemo(() => {
    return filteredOtherTagStats.map(tag => {
      return {
        tag: tag.tagName,
        netProfit: tag.netProfit,
        percentGain: tag.percentGain,
        totalProfit: tag.totalProfit,
        totalLoss: Math.abs(tag.totalLoss), // Convert to positive for display
        trades: tag.count
      };
    });
  }, [filteredOtherTagStats]);
  
  // Table columns
  const columns: SummaryTableColumn[] = [
    { key: 'tag', header: 'Custom Tags' },
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
        There are no trades with custom tags for the selected date range.
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="border rounded-lg shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 py-4">
          <div>
            <CardTitle className="text-xl font-semibold leading-7">Trade Distribution by Custom Tags</CardTitle>
            <CardDescription className="text-sm mt-1 leading-6">
              Trading performance by custom tags from {format(dateRange.from, "PP")} to {format(dateRange.to, "PP")}
            </CardDescription>
          </div>
          <Select
            value={filter}
            onValueChange={(value) => setFilter(value as FilterOption)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Show data from" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top5">Top 5 Tags</SelectItem>
              <SelectItem value="top10">Top 10 Tags</SelectItem>
              <SelectItem value="all">All Tags</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
      </Card>
      
      {otherTagStats.length > 0 ? (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            <HorizontalBarChart 
              data={distributionData}
              title={`${filter === 'all' ? 'All' : filter === 'top5' ? 'Top 5' : 'Top 10'} Custom Tags Distribution`}
              description="Number of trades per custom tag"
              valuePrefix=""
              valueSuffix=" trades"
            />
            
            <HorizontalBarChart 
              data={performanceData}
              title={`${filter === 'all' ? 'All' : filter === 'top5' ? 'Top 5' : 'Top 10'} Custom Tags Performance`}
              description="Net P&L per custom tag"
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
