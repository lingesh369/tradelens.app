
import { supabase } from "@/integrations/supabase/client";
import { Trade, serializePartialExits, serializeTags, serializeAdditionalImages } from "@/types/trade";
import { toUTCDateTime } from "@/utils/tradeUtils";
import { ImageUploadService } from "@/services/imageUploadService";

/**
 * Updates an existing trade
 */
export const updateTrade = async (tradeData: Partial<Trade> & { id: string }): Promise<Trade> => {
  const { id, ...updateData } = tradeData;
  
  // Process timestamps if they exist
  const processedData = { ...updateData };
  if (processedData.entry_time) {
    processedData.entry_time = toUTCDateTime(processedData.entry_time);
  }
  if (processedData.exit_time) {
    processedData.exit_time = toUTCDateTime(processedData.exit_time);
  }
  
  // Ensure action is lowercase if provided
  if (processedData.action) {
    processedData.action = processedData.action.toLowerCase();
  }
  
  // Ensure market_type is lowercase if provided to match database constraint
  if (processedData.market_type) {
    processedData.market_type = processedData.market_type.toLowerCase();
  }
  
  // Ensure fees are positive if provided
  if (processedData.commission !== undefined) {
    processedData.commission = Math.abs(processedData.commission);
  }
  if (processedData.fees !== undefined) {
    processedData.fees = Math.abs(processedData.fees);
  }

  // Process notes to replace any base64 images with uploaded URLs
  if (processedData.notes) {
    processedData.notes = await ImageUploadService.processContentForSaving(
      processedData.notes, 
      'trade'
    );
  }
  
  // Prepare data for Supabase update - serialize JSON fields and ensure proper typing
  const supabaseUpdateData: any = { ...processedData };
  
  // Serialize JSON fields if they exist
  if (processedData.partial_exits !== undefined) {
    supabaseUpdateData.partial_exits = serializePartialExits(processedData.partial_exits);
  }
  if (processedData.tags !== undefined) {
    supabaseUpdateData.tags = serializeTags(processedData.tags);
  }
  if (processedData.additional_images !== undefined) {
    supabaseUpdateData.additional_images = serializeAdditionalImages(processedData.additional_images);
  }

  const { data, error } = await supabase
    .from("trades")
    .update(supabaseUpdateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating trade:", error);
    throw error;
  }
  
  // Database triggers automatically handle all_trades_notes updates
  // for both date changes and note changes. No manual service calls needed.
  
  // Wait a bit for the metrics trigger to complete
  await new Promise(resolve => setTimeout(resolve, 200));

  // Fetch the updated trade with metrics
  const { data: updatedTradeWithMetrics, error: refetchError} = await supabase
    .from("trades")
    .select(`
      *,
      trade_metrics!left (
        net_p_and_l,
        gross_p_and_l,
        percent_gain,
        trade_outcome,
        r2r,
        trade_duration
      )
    `)
    .eq("id", id)
    .single();

  if (refetchError) {
    console.error("Error fetching updated trade with metrics:", refetchError);
    // Return basic updated data if metrics fetch fails
    return {
      ...data,
      action: data.action?.toLowerCase() || "buy",
      commission: Math.abs(data.commission ?? 0),
      fees: Math.abs(data.fees ?? 0),
      contract_multiplier: data.contract_multiplier ?? 1,
      partial_exits: tradeData.partial_exits || null,
      tags: tradeData.tags || null,
      additional_images: tradeData.additional_images || null
    } as Trade;
  }

  // Safely extract metrics with null checks
  const metricsRaw = updatedTradeWithMetrics?.trade_metrics;
  const metrics = Array.isArray(metricsRaw) ? metricsRaw[0] : metricsRaw;

  // Flatten the results to match our Trade interface
  const result = {
    ...updatedTradeWithMetrics,
    // Map metrics fields to our original trade schema format
    net_pl: metrics?.net_p_and_l ?? null,
    percent_gain: metrics?.percent_gain ?? null,
    trade_result: metrics?.trade_outcome ?? null,
    r2r: metrics?.r2r ?? null,
    trade_duration: metrics?.trade_duration ?? null,
    // Ensure action is lowercase
    action: updatedTradeWithMetrics.action ? updatedTradeWithMetrics.action.toLowerCase() : "buy",
    // Make sure fee fields exist and are positive
    commission: Math.abs(updatedTradeWithMetrics.commission ?? 0),
    fees: Math.abs(updatedTradeWithMetrics.fees ?? 0),
    // Ensure contract_multiplier exists with default value
    contract_multiplier: updatedTradeWithMetrics.contract_multiplier ?? 1,
    // Parse JSON fields back for return
    partial_exits: tradeData.partial_exits || null,
    tags: tradeData.tags || null,
    additional_images: tradeData.additional_images || null
  };

  // Remove the nested trade_metrics object
  delete result.trade_metrics;

  return result as Trade;
};
