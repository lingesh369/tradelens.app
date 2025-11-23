import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PublicProfileAnalytics {
  netPnL?: number;
  winRate?: number;
  profitFactor?: number;
  avgWinLoss?: number;
  totalTrades: number;
  winningTrades?: number;
  losingTrades?: number;
  grossProfit?: number;
  grossLoss?: number;
  avgWin?: number;
  avgLoss?: number;
  largestWin?: number;
  largestLoss?: number;
  consecutiveWins?: number;
  consecutiveLosses?: number;
  maxDrawdown?: number;
  sharpeRatio?: number;
  calmarRatio?: number;
  expectancy?: number;
}

interface PublicProfileAnalyticsResponse {
  data: PublicProfileAnalytics;
  appliedFilters: {
    accountIds: string[];
    dateRange: {
      from: string | null;
      to: string | null;
    };
  };
}

export const usePublicProfileAnalytics = (
  userId: string, 
  dateRange?: { from: Date; to: Date },
  enabled = true
) => {
  return useQuery({
    queryKey: ['public-profile-analytics', userId, dateRange],
    queryFn: async (): Promise<PublicProfileAnalyticsResponse> => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      console.log('Fetching public profile analytics for userId:', userId, 'dateRange:', dateRange);
      
      // Build URL with parameters
      const url = new URL(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-profile-analytics`
      );
      url.searchParams.set('userId', userId);
      
      if (dateRange) {
        url.searchParams.set('from', dateRange.from.toISOString());
        url.searchParams.set('to', dateRange.to.toISOString());
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Public profile analytics result:', result);
      
      return result;
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};