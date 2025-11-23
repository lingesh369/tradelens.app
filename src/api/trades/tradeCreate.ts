
import { supabase } from "@/integrations/supabase/client";
import { Trade, serializePartialExits, serializeTags, serializeAdditionalImages } from "@/types/trade";
import { toUTCDateTime, calculateFees } from "@/utils/tradeUtils";
import { ImageUploadService } from "@/services/imageUploadService";

/**
 * Creates a new trade
 */
export const createTrade = async (
  trade: Omit<Trade, "trade_id" | "user_id" | "net_pl" | "percent_gain" | "trade_result" | "r2r" | "trade_duration">, 
  userId: string,
  commissions: { account_id: string | null; market_type: string; total_fees: number }[]
): Promise<Trade> => {
  if (!userId) throw new Error("User not authenticated");
  
  const entryTime = trade.entry_time ? toUTCDateTime(trade.entry_time) : null;
  const exitTime = trade.exit_time ? toUTCDateTime(trade.exit_time) : null;
  
  // Ensure action is lowercase no matter what
  const action = (trade.action || "buy").toLowerCase();
  
  // Process notes to replace any base64 images with uploaded URLs
  let processedNotes = trade.notes;
  if (processedNotes) {
    processedNotes = await ImageUploadService.processContentForSaving(processedNotes, 'trade');
  }
  
  const tradeData = { 
    ...trade,
    action,
    user_id: userId, 
    // Ensure commission and fees are always positive
    commission: Math.abs(trade.commission || 0),
    fees: Math.abs(trade.fees || 0),
    entry_time: entryTime,
    exit_time: exitTime,
    strategy_id: trade.strategy_id === "none" ? null : trade.strategy_id || null,
    chart_link: trade.chart_link || null,
    rating: trade.rating || null,
    contract_multiplier: trade.contract_multiplier || 1,
    notes: processedNotes,
    // Serialize JSON fields for database storage
    partial_exits: serializePartialExits(trade.partial_exits),
    tags: serializeTags(trade.tags),
    additional_images: serializeAdditionalImages(trade.additional_images)
  };
  
  console.log("Sending trade data to Supabase:", tradeData);
  
  const { data, error } = await supabase
    .from("trades")
    .insert([tradeData])
    .select()
    .single();

  if (error) {
    console.error("Supabase error:", error);
    throw error;
  }
  
  // Wait for the metrics to be calculated by the trigger before returning
  // Use a short timeout to allow the trigger to complete
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Database triggers now automatically handle all_trades_notes updates
  // No manual intervention needed - this is handled entirely by database triggers
  
  // Now fetch the trade with its metrics
  const { data: tradeWithMetrics, error: fetchError } = await supabase
    .from("trades")
    .select(`
      *,
      trade_metrics!trade_metrics_trade_id_fkey (
        net_p_and_l,
        gross_p_and_l,
        total_fees,
        percent_gain,
        trade_outcome,
        r2r,
        trade_duration
      )
    `)
    .eq("trade_id", data.trade_id)
    .single();
    
  if (fetchError) {
    console.error("Error fetching trade with metrics:", fetchError);
    // Return the original trade without metrics if there's an error
    return {
      ...data,
      commission: Math.abs(data.commission ?? 0),
      fees: Math.abs(data.fees ?? 0),
      action: data.action.toLowerCase(),
      contract_multiplier: data.contract_multiplier ?? 1,
      partial_exits: trade.partial_exits || null,
      tags: trade.tags || null,
      additional_images: trade.additional_images || null
    } as Trade;
  }
  
  // Safely extract metrics with null checks
  const metrics = tradeWithMetrics?.trade_metrics ?? null;

  // Flatten the results to match our Trade interface
  const result = {
    ...tradeWithMetrics,
    // Map metrics fields to our original trade schema format
    net_pl: metrics?.net_p_and_l ?? null,
    percent_gain: metrics?.percent_gain ?? null,
    trade_result: metrics?.trade_outcome ?? null,
    r2r: metrics?.r2r ?? null,
    trade_duration: metrics?.trade_duration ?? null,
    // Ensure action is lowercase
    action: tradeWithMetrics.action ? tradeWithMetrics.action.toLowerCase() : "buy",
    // Make sure fee fields exist and are positive
    commission: Math.abs(tradeWithMetrics.commission ?? 0),
    fees: Math.abs(tradeWithMetrics.fees ?? 0),
    // Ensure contract_multiplier exists with default value
    contract_multiplier: tradeWithMetrics.contract_multiplier ?? 1,
    // Parse JSON fields
    partial_exits: trade.partial_exits || null,
    tags: trade.tags || null,
    additional_images: trade.additional_images || null
  };
  
  // Remove the nested trade_metrics object
  delete result.trade_metrics;
  
  return result as Trade;
};
