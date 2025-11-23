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

interface InstrumentSectionProps {
  trades: Trade[];
  dateRange: DateRange;
  settings: any;
}

type FilterOption = 'top5' | 'top10' | 'all';

export function InstrumentSection({ trades, dateRange, settings }: InstrumentSectionProps) {
  const [filter, setFilter] = useState<FilterOption>('top10');
  const { settings: globalSettings } = useGlobalSettings();
  const baseCurrency = globalSettings?.base_currency || "USD";

  // Process trade data by instrument
  const instrumentStats = useMemo(() => {
    // Group trades by instrument
    const instrumentMap = new Map<string, {
      instrument: string,
      netProfit: number,
      totalProfit: number,
      totalLoss: number,
      count: number
    }>();
    
    trades.forEach(trade => {
      if (!trade.instrument || trade.net_pl === null || trade.net_pl === undefined) return;
      
      const instrument = trade.instrument;
      const stats = instrumentMap.get(instrument) || {
        instrument,
        netProfit: 0,
        totalProfit: 0,
        totalLoss: 0,
        count: 0
      };
      
      stats.count += 1;
      stats.netProfit += trade.net_pl;
      
      if (trade.net_pl > 0) {
        stats.totalProfit += trade.net_pl;
      } else {
        stats.totalLoss += trade.net_pl;
      }
      
      instrumentMap.set(instrument, stats);
    });
    
    // Convert map to array and sort by net profit
    let statsArray = Array.from(instrumentMap.values())
      .sort((a, b) => Math.abs(b.netProfit) - Math.abs(a.netProfit));
    
    return statsArray;
  }, [trades]);
  
  // Apply filter to get top instruments
  const filteredInstrumentStats = useMemo(() => {
    if (filter === 'top5') return instrumentStats.slice(0, 5);
    if (filter === 'top10') return instrumentStats.slice(0, 10);
    return instrumentStats;
  }, [instrumentStats, filter]);
  
  // Format data for distribution chart
  const distributionData = useMemo(() => {
    return filteredInstrumentStats.map(instrument => ({
      name: instrument.instrument,
      value: instrument.count,
    }));
  }, [filteredInstrumentStats]);
  
  // Format data for performance chart
  const performanceData = useMemo(() => {
    return filteredInstrumentStats.map(instrument => ({
      name: instrument.instrument,
      value: instrument.netProfit,
      count: instrument.count
    }));
  }, [filteredInstrumentStats]);
  
  // Format data for summary table
  const tableData = useMemo(() => {
    return filteredInstrumentStats.map(instrument => {
      const percentGain = instrument.netProfit !== 0 && instrument.count > 0 
        ? (instrument.netProfit / Math.abs(instrument.count)) * 100 
        : 0;
        
      return {
        instrument: instrument.instrument,
        netProfit: instrument.netProfit,
        percentGain,
        totalProfit: instrument.totalProfit,
        totalLoss: Math.abs(instrument.totalLoss), // Convert to positive for display
        trades: instrument.count
      };
    });
  }, [filteredInstrumentStats]);
  
  // Table columns
  const columns: SummaryTableColumn[] = [
    { key: 'instrument', header: 'Instrument' },
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Instrument Statistics</CardTitle>
            <CardDescription>
              Trading performance by instrument from {format(dateRange.from, "PPP")} to {format(dateRange.to, "PPP")}
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
              <SelectItem value="top5">Top 5 Instruments</SelectItem>
              <SelectItem value="top10">Top 10 Instruments</SelectItem>
              <SelectItem value="all">All Instruments</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <HorizontalBarChart 
          data={distributionData}
          title={`${filter === 'all' ? 'All' : filter === 'top5' ? 'Top 5' : 'Top 10'} Instruments Distribution`}
          description="Number of trades per instrument"
          valuePrefix=""
          valueSuffix=" trades"
        />
        
        <HorizontalBarChart 
          data={performanceData}
          title={`${filter === 'all' ? 'All' : filter === 'top5' ? 'Top 5' : 'Top 10'} Instruments Performance`}
          description="Net P&L per instrument"
        />
      </div>
      
      <SummaryTable 
        columns={columns}
        data={tableData}
      />
    </div>
  );
}
