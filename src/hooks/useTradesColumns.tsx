
import { useState, useEffect } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { availableColumns } from "@/components/trades/TradesConstants";

export function useTradesColumns() {
  // Media queries for responsive behavior
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(min-width: 641px) and (max-width: 1023px)");
  const isDesktop = useMediaQuery("(min-width: 1024px) and (max-width: 1279px)");
  const isLargeDesktop = useMediaQuery("(min-width: 1280px)");

  // Get default columns based on screen size
  const getDefaultColumns = () => {
    if (isMobile) {
      // Mobile: Only priority 1 columns (4 columns)
      return availableColumns.filter(col => col.priority === 1).map(col => col.id);
    } else if (isTablet) {
      // Tablet: Priority 1 and 2 columns (6 columns)
      return availableColumns.filter(col => col.priority <= 2).map(col => col.id);
    } else if (isDesktop) {
      // Desktop: Priority 1, 2, and 3 columns (8-10 columns)
      return availableColumns.filter(col => col.priority <= 3).map(col => col.id);
    } else {
      // Large Desktop: All default columns
      return availableColumns.filter(col => col.default).map(col => col.id);
    }
  };

  const [selectedColumns, setSelectedColumns] = useState<string[]>(() => {
    const savedColumns = localStorage.getItem('tradeColumns');
    if (savedColumns) {
      try {
        const parsed = JSON.parse(savedColumns);
        // Return saved columns without filtering to preserve user choice
        return Array.isArray(parsed) ? parsed : getDefaultColumns();
      } catch {
        return getDefaultColumns();
      }
    }
    return getDefaultColumns();
  });

  // Handle column selection change
  const handleColumnChange = (columns: string[]) => {
    setSelectedColumns(columns);
    localStorage.setItem('tradeColumns', JSON.stringify(columns));
  };

  // Only update columns if user hasn't made any custom selections
  // and screen size changes significantly
  useEffect(() => {
    const savedColumns = localStorage.getItem('tradeColumns');
    if (!savedColumns) {
      // Only set defaults if no saved preferences exist
      const newDefaultColumns = getDefaultColumns();
      setSelectedColumns(newDefaultColumns);
      localStorage.setItem('tradeColumns', JSON.stringify(newDefaultColumns));
    }
  }, [isMobile, isTablet, isDesktop, isLargeDesktop]);

  return {
    selectedColumns,
    handleColumnChange,
    isMobile,
    isTablet,
    needsFixedHeader: isMobile || isTablet
  };
}
