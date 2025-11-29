
import { supabase } from "@/integrations/supabase/client";
import { Trade, deserializePartialExits, deserializeTags, deserializeAdditionalImages } from "@/types/trade";

/**
 * Helper function to resolve tag IDs to tag names
 */
const resolveTagNames = async (tagIds: string[]): Promise<string[]> => {
  if (!tagIds || tagIds.length === 0) return [];
  
  const { data, error } = await supabase
    .from("tags")
    .select("tag_id, tag_name")
    .in("tag_id", tagIds);
    
  if (error) {
    console.error("Error fetching tag names:", error);
    return [];
  }
  
  // Create a map for quick lookup
  const tagMap = new Map(data.map(tag => [tag.tag_id, tag.tag_name]));
  
  // Return tag names in the same order as the input IDs
  return tagIds.map(id => tagMap.get(id) || id);
};

/**
 * Fetches all trades for a user with their associated metrics
 */
export const fetchTrades = async (userId: string): Promise<Trade[]> => {
  if (!userId) {
    console.log("No user ID provided for trades fetch");
    return [];
  }

  console.log("Fetching trades for user ID:", userId);

  // Fetch trades with a left join to trade_metrics to get the metrics data
  // Using the inner join syntax but Supabase will handle it as a left join for one-to-one relationships
  const { data, error } = await supabase
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
    .eq("user_id", userId)
    .order("entry_time", { ascending: false });

  if (error) {
    console.error("Error fetching trades:", error);
    throw error;
  }
  
  console.log("Fetched trades data:", data);
  
  // Collect all unique tag IDs from all trades
  const allTagIds = new Set<string>();
  (data || []).forEach((item: any) => {
    const tagIds = deserializeTags(item.tags) || [];
    tagIds.forEach(id => allTagIds.add(id));
  });
  
  // Fetch all tag names in one query
  const tagNamesMap = new Map<string, string>();
  if (allTagIds.size > 0) {
    const { data: tagsData, error: tagsError } = await supabase
      .from("tags")
      .select("tag_id, tag_name")
      .in("tag_id", Array.from(allTagIds));
      
    if (!tagsError && tagsData) {
      tagsData.forEach(tag => {
        tagNamesMap.set(tag.tag_id, tag.tag_name);
      });
    }
  }
  
  // Flatten the results to match our Trade interface
  return (data || []).map((item: any) => {
    // Safely extract metrics with null checks
    // trade_metrics might be an array or a single object depending on the relationship
    const metricsRaw = item?.trade_metrics;
    const metrics = Array.isArray(metricsRaw) ? metricsRaw[0] : metricsRaw;
    
    // Resolve tag IDs to tag names
    const tagIds = deserializeTags(item.tags) || [];
    const tagNames = tagIds.map(id => tagNamesMap.get(id) || id);
    
    const trade = {
      ...item,
      // Map metrics fields to our original trade schema format for backward compatibility
      net_pl: metrics?.net_p_and_l ?? null,
      percent_gain: metrics?.percent_gain ?? null,
      trade_result: metrics?.trade_outcome ?? null,
      r2r: metrics?.r2r ?? null,
      trade_duration: metrics?.trade_duration ?? null,
      // Ensure action is lowercase
      action: item.action ? item.action.toLowerCase() as string : "buy",
      // Make sure fee fields are defined
      commission: item.commission ?? 0,
      fees: item.fees ?? 0,
      // Ensure contract_multiplier is defined
      contract_multiplier: item.contract_multiplier ?? 1,
      // Parse JSON fields
      partial_exits: deserializePartialExits(item.partial_exits),
      tags: tagNames, // Use resolved tag names instead of IDs
      additional_images: deserializeAdditionalImages(item.additional_images),
      // Ensure trade_time_frame is properly included
      trade_time_frame: item.trade_time_frame || null
    };
    
    // Remove the nested trade_metrics object
    delete trade.trade_metrics;
    
    return trade as Trade;
  });
};

/**
 * Fetches a single trade with its metrics
 */
export const fetchTrade = async (tradeId: string, userId: string): Promise<Trade | null> => {
  if (!userId) {
    console.log("No user ID provided for single trade fetch");
    return null;
  }

  const { data, error } = await supabase
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
    .eq("id", tradeId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No match found
    }
    console.error("Error fetching single trade:", error);
    throw error;
  }
  
  if (!data) return null;
  
  // Safely extract metrics with null checks
  // trade_metrics might be an array or a single object depending on the relationship
  const metricsRaw = data?.trade_metrics;
  const metrics = Array.isArray(metricsRaw) ? metricsRaw[0] : metricsRaw;
  
  // Resolve tag IDs to tag names for single trade
  const tagIds = deserializeTags(data.tags) || [];
  const tagNames = await resolveTagNames(tagIds);
  
  // Flatten the results to match our Trade interface
  const trade = {
    ...data,
    // Map metrics fields to our original trade schema format for backward compatibility
    net_pl: metrics?.net_p_and_l ?? null,
    percent_gain: metrics?.percent_gain ?? null,
    trade_result: metrics?.trade_outcome ?? null,
    r2r: metrics?.r2r ?? null,
    trade_duration: metrics?.trade_duration ?? null,
    // Ensure action is lowercase
    action: data.action ? data.action.toLowerCase() as string : "buy",
    // Make sure fee fields are defined
    commission: data.commission ?? 0,
    fees: data.fees ?? 0,
    // Ensure contract_multiplier is defined
    contract_multiplier: data.contract_multiplier ?? 1,
    // Parse JSON fields
    partial_exits: deserializePartialExits(data.partial_exits),
    tags: tagNames, // Use resolved tag names instead of IDs
    additional_images: deserializeAdditionalImages(data.additional_images),
    // Ensure trade_time_frame is properly included
    trade_time_frame: data.trade_time_frame || null
  };
  
  // Remove the nested trade_metrics object
  delete trade.trade_metrics;
  
  return trade as Trade;
};
