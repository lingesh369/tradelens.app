
import React from 'react';
import { HorizontalBarChart } from "@/components/analytics/HorizontalBarChart";
import { FilterOption } from './StrategyFilterSelector';
import { useGlobalSettings } from "@/hooks/useGlobalSettings";

interface StrategyChartsProps {
  distributionData: Array<{ name: string; value: number; }>;
  performanceData: Array<{ name: string; value: number; count?: number; }>;
  filter: FilterOption;
}

export function StrategyCharts({ distributionData, performanceData, filter }: StrategyChartsProps) {
  const { settings } = useGlobalSettings();
  
  const getFilterLabel = () => {
    return filter === 'all' ? 'All' : filter === 'top5' ? 'Top 5' : 'Top 10';
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <HorizontalBarChart 
        data={distributionData}
        title={`${getFilterLabel()} Strategies Distribution`}
        description="Number of trades per strategy"
        valuePrefix=""
        valueSuffix=" trades"
      />
      
      <HorizontalBarChart 
        data={performanceData}
        title={`${getFilterLabel()} Strategies Performance`}
        description="Net P&L per strategy"
        valuePrefix="$"
      />
    </div>
  );
}
