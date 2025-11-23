
import { useEffect } from "react";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { useGlobalFilters } from "@/context/FilterContext";
import { Trade } from "@/types/trade";

interface TradesFiltersProps {
  trades: Trade[];
  onFilteredTradesChange: (filteredTrades: Trade[]) => void;
}

export function TradesFilters({ trades, onFilteredTradesChange }: TradesFiltersProps) {
  const { filters } = useGlobalFilters();

  useEffect(() => {
    console.log("Trades filters - Global filters:", filters);
    console.log("Trades filters - Total trades:", trades.length);

    const filteredTrades = trades.filter(trade => {
      // Date filter - Fixed logic
      if (trade.entry_time && filters.dateRange.from && filters.dateRange.to) {
        const tradeDate = new Date(trade.entry_time);
        const filterFrom = startOfDay(filters.dateRange.from);
        const filterTo = endOfDay(filters.dateRange.to);
        
        const dateMatches = isWithinInterval(tradeDate, {
          start: filterFrom,
          end: filterTo
        });
        
        console.log(`Trade ${trade.instrument} date: ${tradeDate.toISOString()}, Filter from: ${filterFrom.toISOString()}, Filter to: ${filterTo.toISOString()}, Matches: ${dateMatches}`);
        
        if (!dateMatches) return false;
      }

      // Account filter
      if (!filters.selectedAccounts.allAccounts) {
        const accountMatches = trade.account_id ? filters.selectedAccounts.accountIds.includes(trade.account_id) : false;
        if (!accountMatches) return false;
      }
      return true;
    });

    console.log("Trades filters - Filtered trades:", filteredTrades.length);
    onFilteredTradesChange(filteredTrades);
  }, [trades, filters, onFilteredTradesChange]);

  return null; // This is a logic-only component
}
