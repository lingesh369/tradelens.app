import { useQuery } from "@tanstack/react-query";
import { fetchTrades } from "@/api/tradeService";
import { Trade } from "@/types/trade";
import { useMemo } from "react";
import { isWithinInterval } from "date-fns";

interface UsePublicTraderTradesProps {
  userId: string;
  privacySettings?: {
    selectedAccountIds?: string[];
    dateRange?: {
      from: Date;
      to: Date;
    };
  };
  enabled?: boolean;
}

export function usePublicTraderTrades({ 
  userId, 
  privacySettings, 
  enabled = true 
}: UsePublicTraderTradesProps) {
  
  // Fetch all trades for the trader
  const tradesQuery = useQuery({
    queryKey: ["public-trader-trades", userId],
    queryFn: () => {
      if (!userId) {
        console.log("No user ID provided for public trader trades fetch");
        return [];
      }
      console.log("Fetching public trader trades for user ID:", userId);
      return fetchTrades(userId);
    },
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Filter trades based on privacy settings
  const filteredTrades = useMemo(() => {
    const allTrades = tradesQuery.data || [];
    
    if (!privacySettings) {
      return allTrades;
    }

    let filtered = allTrades;

    // Filter by selected accounts (if specific accounts are selected)
    if (privacySettings.selectedAccountIds && privacySettings.selectedAccountIds.length > 0) {
      filtered = filtered.filter(trade => 
        privacySettings.selectedAccountIds!.includes(trade.account_id)
      );
    }

    // Filter by date range
    if (privacySettings.dateRange) {
      filtered = filtered.filter(trade => {
        if (!trade.entry_time) return false;
        const tradeDate = new Date(trade.entry_time);
        return isWithinInterval(tradeDate, {
          start: privacySettings.dateRange!.from,
          end: privacySettings.dateRange!.to
        });
      });
    }

    return filtered;
  }, [tradesQuery.data, privacySettings]);

  const hasRealTrades = useMemo(() => {
    return filteredTrades.length > 0;
  }, [filteredTrades]);

  return {
    trades: filteredTrades,
    allTrades: tradesQuery.data || [],
    isLoading: tradesQuery.isLoading,
    isError: tradesQuery.isError,
    error: tradesQuery.error,
    hasRealTrades,
    refetch: tradesQuery.refetch,
  };
}
