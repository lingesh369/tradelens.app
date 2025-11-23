
import { DateRange, DatePreset } from "./DateRangeTypes";

export const getPresetDateRange = (preset: DatePreset): DateRange => {
  const today = new Date();
  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

  switch (preset) {
    case "allTime":
      return {
        from: new Date(2020, 0, 1), // Start from 2020 as a reasonable "all time" start
        to: endOfDay(today),
        preset: "allTime"
      };

    case "today":
      return {
        from: startOfDay(today),
        to: endOfDay(today),
        preset: "today"
      };
      
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        from: startOfDay(yesterday),
        to: endOfDay(yesterday),
        preset: "yesterday"
      };
    }

    case "thisWeek": {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return {
        from: startOfDay(startOfWeek),
        to: endOfDay(today),
        preset: "thisWeek"
      };
    }

    case "lastWeek": {
      const lastWeekStart = new Date(today);
      lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
      return {
        from: startOfDay(lastWeekStart),
        to: endOfDay(lastWeekEnd),
        preset: "lastWeek"
      };
    }

    case "thisMonth": {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        from: startOfDay(startOfMonth),
        to: endOfDay(today),
        preset: "thisMonth"
      };
    }

    case "lastMonth": {
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        from: startOfDay(lastMonthStart),
        to: endOfDay(lastMonthEnd),
        preset: "lastMonth"
      };
    }

    case "last30Days": {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      return {
        from: startOfDay(thirtyDaysAgo),
        to: endOfDay(today),
        preset: "last30Days"
      };
    }

    case "thisYear": {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      return {
        from: startOfDay(startOfYear),
        to: endOfDay(today),
        preset: "thisYear"
      };
    }

    case "lastYear": {
      const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
      const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31);
      return {
        from: startOfDay(lastYearStart),
        to: endOfDay(lastYearEnd),
        preset: "lastYear"
      };
    }

    default:
      return {
        from: new Date(2020, 0, 1),
        to: endOfDay(today),
        preset: "allTime"
      };
  }
};

export const formatDateRangeDisplay = (dateRange: DateRange, presets: Array<{ value: string; label: string }>): string => {
  if (!dateRange.from || !dateRange.to) {
    return "Select date range";
  }

  const preset = presets.find(p => p.value === dateRange.preset);
  if (preset && preset.value !== "custom") {
    return preset.label;
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  if (dateRange.from.toDateString() === dateRange.to.toDateString()) {
    return formatDate(dateRange.from);
  }

  return `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`;
};

export const DATE_PRESETS = [
  { value: "allTime", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "thisWeek", label: "This Week" },
  { value: "lastWeek", label: "Last Week" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "last30Days", label: "Last 30 Days" },
  { value: "thisYear", label: "This Year" },
  { value: "lastYear", label: "Last Year" },
  { value: "custom", label: "Custom Range" }
];
