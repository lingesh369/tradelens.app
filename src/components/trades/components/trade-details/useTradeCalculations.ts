
import { useGlobalSettings } from "@/hooks/useGlobalSettings";

interface TradeCalculationParams {
  entryPrice: number;
  exitPrice: number | null;
  stopLoss: number | null;
  quantity: number;
  fees: number;
  action: string;
  contractMultiplier?: number;
}

export function useTradeCalculations({
  entryPrice,
  exitPrice,
  stopLoss,
  quantity,
  fees,
  action,
  contractMultiplier = 1
}: TradeCalculationParams) {
  const { settings } = useGlobalSettings();

  const calculateValues = () => {
    // Normalize action to handle both long/short and buy/sell
    const normalizedAction = action.toLowerCase();
    const isLong = normalizedAction === 'long' || normalizedAction === 'buy';
    
    let grossPnl = 0;
    let percentGain = 0;
    
    if (exitPrice !== null && entryPrice) {
      // Calculate gross P&L (before fees)
      const priceDiff = isLong
        ? exitPrice - entryPrice 
        : entryPrice - exitPrice;
      grossPnl = priceDiff * quantity * contractMultiplier;
      
      // Calculate percent gain based on cost basis
      const costBasis = entryPrice * quantity;
      percentGain = (grossPnl / costBasis) * 100;
    }
    
    // Calculate net P&L (after fees)
    const netPnl = grossPnl - Math.abs(fees);
    
    // Calculate trade risk (distance to stop loss)
    let tradeRisk = 0;
    if (stopLoss !== null && entryPrice) {
      const riskPerUnit = isLong
        ? entryPrice - stopLoss 
        : stopLoss - entryPrice;
      tradeRisk = Math.abs(riskPerUnit * quantity * contractMultiplier);
    }
    
    // Calculate R-Multiple (realized R2R)
    let realizedR2R = 0;
    if (exitPrice !== null && stopLoss !== null && entryPrice && tradeRisk > 0) {
      realizedR2R = netPnl / tradeRisk;
    }
    
    return {
      netPnl,
      percentGain,
      tradeRisk,
      realizedR2R,
      grossPnl
    };
  };

  return calculateValues();
}
