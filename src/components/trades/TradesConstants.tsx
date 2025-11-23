
import { ColumnOption } from "@/components/trades/ColumnSelector";

// Define available columns for the trade table
export const availableColumns: ColumnOption[] = [{
  id: "instrument",
  label: "Instrument",
  default: true,
  priority: 1 // Highest priority - always show
}, {
  id: "entryDate",
  label: "Entry Date",
  default: true,
  priority: 1 // Highest priority - always show
}, {
  id: "exitDate",
  label: "Exit Date",
  default: false,
  priority: 3 // Show on desktop only
}, {
  id: "action",
  label: "Action",
  default: true,
  priority: 1 // Highest priority - always show
}, {
  id: "netPnl",
  label: "Net P&L",
  default: true,
  priority: 1 // Highest priority - always show
}, {
  id: "entryPrice",
  label: "Entry Price",
  default: true,
  priority: 2 // Show on tablet and up
}, {
  id: "status",
  label: "Status",
  default: true,
  priority: 2 // Show on tablet and up
}, {
  id: "exitPrice",
  label: "Exit Price",
  default: true,
  priority: 3 // Show on desktop only
}, {
  id: "percentGain",
  label: "% Gain",
  default: true,
  priority: 3 // Show on desktop only
}, {
  id: "quantity",
  label: "Quantity",
  default: false,
  priority: 4 // Show on large desktop only
}, {
  id: "marketType",
  label: "Market Type",
  default: true,
  priority: 4 // Show on large desktop only
}, {
  id: "timeframe",
  label: "Time Frame",
  default: false,
  priority: 4 // Show on large desktop only
}, {
  id: "target",
  label: "Target",
  default: false,
  priority: 4 // Show on large desktop only
}, {
  id: "stopLoss",
  label: "Stop Loss",
  default: false,
  priority: 4 // Show on large desktop only
}, {
  id: "r2r",
  label: "R:R",
  default: false,
  priority: 4 // Show on large desktop only
}, {
  id: "totalFees",
  label: "Total Fees",
  default: false,
  priority: 4 // Show on large desktop only
}, {
  id: "grossPnl",
  label: "Gross P&L",
  default: true,
  priority: 3 // Show on desktop only
}, {
  id: "strategy",
  label: "Strategy",
  default: true,
  priority: 3 // Show on desktop only
}, {
  id: "account",
  label: "Account",
  default: false,
  priority: 4 // Show on large desktop only
}, {
  id: "notes",
  label: "Notes",
  default: false,
  priority: 4 // Show on large desktop only
}, {
  id: "tags",
  label: "Tags",
  default: false,
  priority: 4 // Show on large desktop only
}, {
  id: "tradeRating",
  label: "Trade Rating",
  default: false,
  priority: 4 // Show on large desktop only
}];
