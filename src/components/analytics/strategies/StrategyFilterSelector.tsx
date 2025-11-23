
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type FilterOption = 'top5' | 'top10' | 'all';

interface StrategyFilterSelectorProps {
  filter: FilterOption;
  onFilterChange: (value: FilterOption) => void;
}

export function StrategyFilterSelector({ filter, onFilterChange }: StrategyFilterSelectorProps) {
  return (
    <Select
      value={filter}
      onValueChange={(value) => onFilterChange(value as FilterOption)}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Show data from" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="top5">Top 5 Strategies</SelectItem>
        <SelectItem value="top10">Top 10 Strategies</SelectItem>
        <SelectItem value="all">All Strategies</SelectItem>
      </SelectContent>
    </Select>
  );
}
