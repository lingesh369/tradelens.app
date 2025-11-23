export interface Trade {
  trade_id: string;
  user_id: string;
  instrument: string;
  action: string; // Allow any string but we'll ensure it's lowercase in our code
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  entry_time: string | null;
  exit_time: string | null;
  // Following fields have been moved to trade_metrics table, but we still include them in the type
  // for backward compatibility, they will be populated from the metrics table
  net_pl?: number | null; 
  percent_gain?: number | null;
  trade_result?: string | null;
  r2r?: number | null;
  trade_duration?: unknown | null;
  // Regular columns
  market_type: string;
  chart_link: string | null;
  sl: number | null;
  target: number | null;
  rating: number | null;
  notes: string | null;
  account_id: string | null;
  commission: number | null;
  fees: number | null;
  strategy_id: string | null;
  contract: string | null;
  trade_time_frame?: string | null;
  contract_multiplier: number | null;
  // New fields
  tick_size?: number | null;
  tick_value?: number | null;
  trade_rating?: number | null;
  remaining_quantity?: number | null;
  parent_trade_id?: string | null;
  // Partial exits fields
  status?: 'open' | 'partially_closed' | 'closed';
  total_exit_quantity?: number | null;
  // Trade timeline field - stored as JSON in database
  partial_exits?: PartialExit[] | null;
  // New unified fields for tags and images
  tags?: string[] | null;
  main_image?: string | null;
  additional_images?: string[] | null;
  // Sharing fields
  is_shared?: boolean | null;
  shared_at?: string | null;
  shared_by_user_id?: string | null;
  // Add missing trade_date field
  trade_date?: string | null;
}

export interface PartialExit {
  action: string;
  datetime: string;
  quantity: number;
  price: number;
  fee: number;
}

// Utility functions for JSON conversion
export const serializePartialExits = (partialExits: PartialExit[] | null): any => {
  return partialExits ? JSON.stringify(partialExits) : null;
};

export const deserializePartialExits = (jsonData: any): PartialExit[] | null => {
  if (!jsonData) return null;
  if (typeof jsonData === 'string') {
    try {
      return JSON.parse(jsonData);
    } catch (e) {
      return null;
    }
  }
  if (Array.isArray(jsonData)) {
    return jsonData;
  }
  return null;
};

// Utility functions for tags and images
export const serializeTags = (tags: string[] | null): any => {
  return tags ? JSON.stringify(tags) : null;
};

export const deserializeTags = (jsonData: any): string[] | null => {
  if (!jsonData) return null;
  if (typeof jsonData === 'string') {
    try {
      return JSON.parse(jsonData);
    } catch (e) {
      return null;
    }
  }
  if (Array.isArray(jsonData)) {
    return jsonData;
  }
  return null;
};

export const serializeAdditionalImages = (images: string[] | null): any => {
  return images ? JSON.stringify(images) : null;
};

export const deserializeAdditionalImages = (jsonData: any): string[] | null => {
  if (!jsonData) return null;
  if (typeof jsonData === 'string') {
    try {
      return JSON.parse(jsonData);
    } catch (e) {
      return null;
    }
  }
  if (Array.isArray(jsonData)) {
    return jsonData;
  }
  return null;
};

export interface TradeMetrics {
  metric_id: string;
  trade_id: string;
  user_id: string;
  pnl: number | null;
  fees: number | null;
  swap: number | null;
  trade_duration: string | null;
  trade_outcome: string | null;
  percent_gain: number | null;
  r_multiple: number | null;
  total_pnl: number | null;
  average_trade_pnl: number | null;
  average_win: number | null;
  average_loss: number | null;
  win_rate: number | null;
  loss_rate: number | null;
  break_even_rate: number | null;
  largest_win: number | null;
  largest_loss: number | null;
  average_hold_time: string | null;
  average_hold_win: string | null;
  average_hold_loss: string | null;
  max_consecutive_wins: number | null;
  max_consecutive_losses: number | null;
  profit_factor: number | null;
  largest_profit_day: number | null;
  largest_loss_day: number | null;
  expected_profitability: number | null;
  created_at: string;
  updated_at: string;
}

export interface TradeImage {
  id: string;
  trade_id: string;
  user_id: string;
  image_url: string;
  image_name: string;
  created_at: string;
  updated_at: string;
}
