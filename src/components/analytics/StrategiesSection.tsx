
import React, { useState } from 'react';
import { format } from "date-fns";
import { Trade } from "@/hooks/useTrades";
import { DateRange } from "@/components/filters/DateRangeTypes";
import { SummaryTable } from "./SummaryTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StrategyFilterSelector, FilterOption } from './strategies/StrategyFilterSelector';
import { NoDataDisplay } from './common/NoDataDisplay';
import { useStrategyStats } from './strategies/useStrategyStats';
import { getStrategyTableColumns } from './strategies/strategyTableColumns';
import { StrategyCharts } from './strategies/StrategyCharts';

interface StrategiesSectionProps {
  trades: Trade[];
  dateRange: DateRange;
  settings: any;
}

export function StrategiesSection({ trades, dateRange, settings }: StrategiesSectionProps) {
  const [filter, setFilter] = useState<FilterOption>('top10');
  
  const {
    distributionData,
    performanceData,
    tableData,
    hasData
  } = useStrategyStats(trades, filter);
  
  // Get table columns
  const columns = getStrategyTableColumns();

  return (
    <div className="space-y-6">
      <Card className="border rounded-lg shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 py-4">
          <div>
            <CardTitle className="text-xl font-semibold leading-7">Strategy Statistics</CardTitle>
            <CardDescription className="text-sm mt-1 leading-6">
              Trading performance by strategy from {format(dateRange.from, "PP")} to {format(dateRange.to, "PP")}
            </CardDescription>
          </div>
          <StrategyFilterSelector filter={filter} onFilterChange={setFilter} />
        </CardHeader>
      </Card>
      
      {hasData ? (
        <>
          <StrategyCharts 
            distributionData={distributionData} 
            performanceData={performanceData} 
            filter={filter} 
          />
          
          <SummaryTable 
            columns={columns}
            data={tableData}
          />
        </>
      ) : (
        <NoDataDisplay message="There is no strategy data available for the selected date range." />
      )}
    </div>
  );
}
