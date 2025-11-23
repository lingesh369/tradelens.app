
import { Trade, TradeMetrics } from "@/types/trade";
import { fetchTrades, fetchTrade } from "./trades/tradeQueries";
import { createTrade } from "./trades/tradeCreate";
import { updateTrade } from "./trades/tradeUpdate";
import { deleteTrade } from "./trades/tradeDelete";
import { uploadTradeImage, listTradeImages } from "./trades/tradeStorage";

export {
  fetchTrades,
  fetchTrade,
  createTrade,
  updateTrade,
  deleteTrade,
  uploadTradeImage,
  listTradeImages
};

// Re-export the Trade and TradeMetrics types
export type { Trade, TradeMetrics } from "@/types/trade";
