
import React, { useMemo, useState } from 'react';
import { format } from "date-fns";
import { Trade } from "@/hooks/useTrades";
import { DateRange } from "@/components/filters/DateRangeTypes";
import { HorizontalBarChart } from "./HorizontalBarChart";
import { SummaryTable, SummaryTableColumn } from "./SummaryTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { formatCurrencyValue } from "@/lib/currency-data";

interface MarketsSectionProps {
  trades: Trade[];
  dateRange: DateRange;
  settings: any;
}

type FilterOption = 'top5' | 'top10' | 'all';

export function MarketsSection({ trades, dateRange, settings }: MarketsSectionProps) {
  const [filter, setFilter] = useState<FilterOption>('top10');
  const { settings: globalSettings } = useGlobalSettings();
  const baseCurrency = globalSettings?.base_currency || "USD";

  // Process trade data by market
  const marketStats = useMemo(() => {
    // Group trades by market
    const marketMap = new Map<string, {
      market: string,
      netProfit: number,
      totalProfit: number,
      totalLoss: number,
      count: number,
      winCount: number,
      lossCount: number
    }>();
    
    trades.forEach(trade => {
      if (!trade.market_type || trade.net_pl === null || trade.net_pl === undefined) return;
      
      const market = trade.market_type;
      const stats = marketMap.get(market) || {
        market,
        netProfit: 0,
        totalProfit: 0,
        totalLoss: 0,
        count: 0,
        winCount: 0,
        lossCount: 0
      };
      
      stats.count += 1;
      stats.netProfit += trade.net_pl;
      
      if (trade.net_pl > 0) {
        stats.totalProfit += trade.net_pl;
        stats.winCount += 1;
      } else {
        stats.totalLoss += trade.net_pl;
        stats.lossCount += 1;
      }
      
      marketMap.set(market, stats);
    });
    
    // Convert map to array and sort by net profit
    let statsArray = Array.from(marketMap.values())
      .sort((a, b) => Math.abs(b.netProfit) - Math.abs(a.netProfit));
    
    return statsArray;
  }, [trades]);
  
  // Apply filter to get top markets
  const filteredMarketStats = useMemo(() => {
    if (filter === 'top5') return marketStats.slice(0, 5);
    if (filter === 'top10') return marketStats.slice(0, 10);
    return marketStats;
  }, [marketStats, filter]);
  
  // Format data for distribution chart
  const distributionData = useMemo(() => {
    return filteredMarketStats.map(market => ({
      name: market.market,
      value: market.count,
    }));
  }, [filteredMarketStats]);
  
  // Format data for performance chart
  const performanceData = useMemo(() => {
    return filteredMarketStats.map(market => ({
      name: market.market,
      value: market.netProfit,
      count: market.count
    }));
  }, [filteredMarketStats]);
  
  // Format data for summary table
  const tableData = useMemo(() => {
    return filteredMarketStats.map(market => {
      const winRate = market.count > 0 ? (market.winCount / market.count) * 100 : 0;
      
      return {
        market: market.market,
        netProfit: market.netProfit,
        winRate,
        totalProfit: market.totalProfit,
        totalLoss: Math.abs(market.totalLoss), // Convert to positive for display
        trades: market.count,
        wins: market.winCount,
        losses: market.lossCount
      };
    });
  }, [filteredMarketStats]);
  
  // Table columns
  const columns: SummaryTableColumn[] = [
    { key: 'market', header: 'Market' },
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
    { 
      key: 'trades', 
      header: 'Trades', 
      className: 'text-right' 
    },
    { 
      key: 'wins', 
      header: 'Wins', 
      className: 'text-right text-[hsl(var(--profit))]' 
    },
    { 
      key: 'losses', 
      header: 'Losses', 
      className: 'text-right text-[hsl(var(--loss))]' 
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Market Statistics</CardTitle>
            <CardDescription>
              Trading performance by market from {format(dateRange.from, "PPP")} to {format(dateRange.to, "PPP")}
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
              <SelectItem value="top5">Top 5 Markets</SelectItem>
              <SelectItem value="top10">Top 10 Markets</SelectItem>
              <SelectItem value="all">All Markets</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <HorizontalBarChart 
          data={distributionData}
          title={`${filter === 'all' ? 'All' : filter === 'top5' ? 'Top 5' : 'Top 10'} Markets Distribution`}
          description="Number of trades per market"
          valuePrefix=""
          valueSuffix=" trades"
        />
        
        <HorizontalBarChart 
          data={performanceData}
          title={`${filter === 'all' ? 'All' : filter === 'top5' ? 'Top 5' : 'Top 10'} Markets Performance`}
          description="Net P&L per market"
        />
      </div>
      
      <SummaryTable 
        columns={columns}
        data={tableData}
      />
    </div>
  );
}
