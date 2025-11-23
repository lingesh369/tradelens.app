
export interface DateRange {
  from: Date;
  to: Date;
  preset: DatePreset;
}

export type DatePreset = 
  | "allTime"
  | "today"
  | "yesterday" 
  | "thisWeek" 
  | "lastWeek" 
  | "thisMonth" 
  | "lastMonth" 
  | "thisYear" 
  | "lastYear" 
  | "last30Days"
  | "last90Days"
  | "custom";

export interface DateRangeSelectorProps {
  onChange: (dateRange: DateRange) => void;
  className?: string;
}
