import { useState } from 'react';
import { Trade } from "@/hooks/useTrades";
import { DateRange } from "@/components/filters/DateRangeTypes";

export const useAnalyticsData = (trades: Trade[]) => {
  const [activeSection, setActiveSection] = useState("overview");

  return {
    activeSection,
    setActiveSection,
  };
};
