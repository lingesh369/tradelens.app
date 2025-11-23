
import { Trade } from "@/types/trade";
import { addDays, subDays, format } from "date-fns";

// Generate realistic dummy trades for onboarding
export const generateDummyTrades = (userId: string): Trade[] => {
  const instruments = [
    { symbol: "EURUSD", type: "Forex" },
    { symbol: "GBPJPY", type: "Forex" },
    { symbol: "US30", type: "Futures" },
    { symbol: "AAPL", type: "Stocks" },
    { symbol: "TSLA", type: "Stocks" },
    { symbol: "BTCUSD", type: "Crypto" },
    { symbol: "GOLD", type: "Futures" },
    { symbol: "NVDA", type: "Stocks" },
    { symbol: "USDJPY", type: "Forex" },
    { symbol: "SPY", type: "Stocks" }
  ];

  const actions = ["buy", "sell"];
  const today = new Date();
  
  const dummyTrades: Trade[] = [];

  for (let i = 0; i < 10; i++) {
    const instrument = instruments[i];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const entryPrice = 100 + Math.random() * 200; // Random price between 100-300
    const quantity = Math.floor(Math.random() * 100) + 10; // 10-110 units
    
    // Create realistic price movements
    const priceChange = (Math.random() - 0.5) * 20; // -10 to +10 price change
    const exitPrice = entryPrice + priceChange;
    
    // Calculate P&L based on action and price movement
    let netPl;
    if (action === "buy") {
      netPl = (exitPrice - entryPrice) * quantity;
    } else {
      netPl = (entryPrice - exitPrice) * quantity;
    }
    
    // Add some randomness and fees
    const commission = quantity * 0.1; // $0.10 per unit
    const fees = Math.random() * 5 + 1; // $1-6 in fees
    netPl = netPl - commission - fees;
    
    const percentGain = (netPl / (entryPrice * quantity)) * 100;
    
    // Spread trades across last 30 days
    const daysAgo = Math.floor(Math.random() * 30);
    const entryTime = subDays(today, daysAgo);
    const exitTime = addDays(entryTime, Math.floor(Math.random() * 3) + 1); // 1-3 days later
    
    const trade: Trade = {
      trade_id: `dummy-trade-${i + 1}`,
      user_id: userId,
      instrument: instrument.symbol,
      action: action,
      entry_price: parseFloat(entryPrice.toFixed(2)),
      exit_price: parseFloat(exitPrice.toFixed(2)),
      quantity: quantity,
      entry_time: entryTime.toISOString(),
      exit_time: exitTime.toISOString(),
      market_type: instrument.type,
      commission: parseFloat(commission.toFixed(2)),
      fees: parseFloat(fees.toFixed(2)),
      net_pl: parseFloat(netPl.toFixed(2)),
      percent_gain: parseFloat(percentGain.toFixed(2)),
      trade_result: netPl > 0 ? "WIN" : "LOSS",
      target: action === "buy" ? entryPrice * 1.03 : entryPrice * 0.97, // 3% target
      sl: action === "buy" ? entryPrice * 0.98 : entryPrice * 1.02, // 2% stop loss
      r2r: Math.abs((entryPrice * 0.03) / (entryPrice * 0.02)), // Risk-reward ratio
      contract_multiplier: 1,
      rating: Math.floor(Math.random() * 5) + 1,
      notes: `Sample trade for ${instrument.symbol}. This is dummy data for demonstration.`,
      account_id: "dummy-account-1",
      strategy_id: null,
      trade_duration: null,
      chart_link: null,
      contract: null,
      trade_time_frame: null
    };
    
    dummyTrades.push(trade);
  }
  
  // Sort by entry time (newest first)
  return dummyTrades.sort((a, b) => 
    new Date(b.entry_time || 0).getTime() - new Date(a.entry_time || 0).getTime()
  );
};

// Generate dummy account for demo purposes
export const generateDummyAccount = (userId: string) => {
  return {
    account_id: "dummy-account-1",
    user_id: userId,
    account_name: "Demo Trading Account",
    broker: "Sample Broker",
    type: "Demo",
    starting_balance: 10000,
    current_balance: 12450, // Shows some profit
    status: "Active",
    commission: 0.1,
    fees: 2,
    profit_loss: 2450,
    created_on: subDays(new Date(), 60).toISOString()
  };
};

// Check if user should see dummy data (has zero real trades)
export const shouldShowDummyData = (realTrades: Trade[]): boolean => {
  return realTrades.length === 0;
};

// Generate dummy data banner messages
export const getDummyDataBanners = () => {
  return {
    dashboard: "You are viewing sample data to understand the platform. Add your first trade to start tracking your own performance.",
    trades: "These are sample trades. Add your first real trade to replace them.",
    analytics: "You are currently viewing sample analytics. Start trading to generate real insights."
  };
};
