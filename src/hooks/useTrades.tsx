
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCommissions } from "@/hooks/useCommissions";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Trade, TradeMetrics } from "@/types/trade";
import { formatCurrency, formatDateTime, toUTCDateTime } from "@/utils/tradeUtils";
import { 
  fetchTrades, 
  fetchTrade,
  createTrade, 
  updateTrade, 
  deleteTrade 
} from "@/api/tradeService";
import { ImageUploadService } from "@/services/imageUploadService";

export type { Trade, TradeMetrics } from "@/types/trade";

// Updated list of valid market types for the standardized constraint
const VALID_MARKET_TYPES = ["Stock", "Forex", "Crypto", "Options", "Futures", "Commodities", "Indices"];

export function useTrades() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { commissions } = useCommissions();
  const { settings } = useGlobalSettings();

  // Get user ID from auth context
  const userId = user?.id;

  // Fetch real trades query
  const tradesQuery = useQuery({
    queryKey: ["trades", userId],
    queryFn: async () => {
      if (!userId) {
        console.log("No user ID available for trades fetch");
        return [];
      }
      console.log("Fetching trades for user ID:", userId);
      const trades = await fetchTrades(userId);
      console.log(`Fetched ${trades.length} trades from database`);
      return trades;
    },
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Always use real trades data - no dummy data
  const trades = tradesQuery.data || [];
  const hasRealTrades = trades.length > 0;
  const isShowingDummyData = false; // Disabled dummy data feature

  // Create trade mutation
  const createTradeMutation = useMutation({
    mutationFn: async (tradeData: Omit<Trade, "id" | "user_id" | "net_pl" | "percent_gain" | "trade_result" | "r2r" | "trade_duration">) => {
      if (!userId) {
        throw new Error("User not authenticated");
      }
      
      // Process notes to replace any base64 images with uploaded URLs
      let processedNotes = tradeData.notes;
      if (processedNotes) {
        processedNotes = await ImageUploadService.processContentForSaving(processedNotes, 'trade');
      }

      // Ensure market_type is valid
      if (tradeData.market_type && !VALID_MARKET_TYPES.includes(tradeData.market_type)) {
        tradeData.market_type = VALID_MARKET_TYPES[0]; // Default to first valid type
      }

      return createTrade({...tradeData, notes: processedNotes}, userId, commissions);
    },
    onSuccess: (data) => {
      console.log('Trade created successfully:', data);
      // Invalidate and refetch trades immediately
      queryClient.invalidateQueries({ queryKey: ["trades", userId] });
      queryClient.refetchQueries({ queryKey: ["trades", userId] });
      console.log('Refetching trades for user:', userId);
      toast({
        title: "Trade added successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error adding trade:", error);
      toast({
        title: "Error adding trade",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update trade mutation
  const updateTradeMutation = useMutation({
    mutationFn: async (tradeData: Partial<Trade> & { id: string }) => {
      // Process notes to replace any base64 images with uploaded URLs
      let processedData = { ...tradeData };
      if (processedData.notes) {
        processedData.notes = await ImageUploadService.processContentForSaving(processedData.notes, 'trade');
      }

      // Ensure market_type is valid
      if (processedData.market_type && !VALID_MARKET_TYPES.includes(processedData.market_type)) {
        processedData.market_type = VALID_MARKET_TYPES[0]; // Default to first valid type
      }

      return updateTrade(processedData);
    },
    onSuccess: (data) => {
      console.log('Trade updated successfully:', data);
      // Invalidate and refetch trades immediately
      queryClient.invalidateQueries({ queryKey: ["trades", userId] });
      queryClient.refetchQueries({ queryKey: ["trades", userId] });
      console.log('Refetching trades for user:', userId);
      toast({
        title: "Trade updated successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error updating trade:", error);
      toast({
        title: "Error updating trade",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete trade mutation
  const deleteTradeMutation = useMutation({
    mutationFn: (tradeId: string) => {
      if (!userId) {
        throw new Error("User not authenticated");
      }
      return deleteTrade(tradeId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades", userId] });
      toast({
        title: "Trade deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error deleting trade:", error);
      toast({
        title: "Error deleting trade",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Format datetime string with user's timezone
  const formatTradeDateTime = (timestamp: string | null): string => {
    return formatDateTime(timestamp, settings?.time_zone || "UTC");
  };

  // Format currency with user's currency settings
  const formatTradeCurrency = (value: number | null): string => {
    return formatCurrency(value, settings?.base_currency || "USD");
  };

  // Convert local datetime to UTC
  const tradeToUTCDateTime = (localDateTimeStr: string): string => {
    return toUTCDateTime(localDateTimeStr, settings?.time_zone || "UTC");
  };

  return {
    trades,
    isLoading: tradesQuery.isLoading,
    isError: tradesQuery.isError,
    error: tradesQuery.error,
    isShowingDummyData,
    hasRealTrades,
    createTrade: createTradeMutation.mutate,
    updateTrade: updateTradeMutation.mutate,
    deleteTrade: deleteTradeMutation.mutate,
    fetchTrade,
    refetch: tradesQuery.refetch,
    formatDateTime: formatTradeDateTime,
    formatCurrency: formatTradeCurrency,
    toUTCDateTime: tradeToUTCDateTime,
    VALID_MARKET_TYPES,
  };
}
