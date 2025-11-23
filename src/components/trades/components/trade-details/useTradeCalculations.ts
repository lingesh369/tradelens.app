
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
    let netPnl = 0;
    let percentGain = 0;
    
    if (exitPrice !== null && entryPrice) {
      const priceDiff = action === "buy" 
        ? exitPrice - entryPrice 
        : entryPrice - exitPrice;
      netPnl = priceDiff * quantity * contractMultiplier;
      percentGain = (priceDiff / entryPrice) * 100;
    }
    
    let tradeRisk = 0;
    if (stopLoss !== null && entryPrice) {
      const riskPerUnit = action === "buy" 
        ? entryPrice - stopLoss 
        : stopLoss - entryPrice;
      tradeRisk = Math.abs(riskPerUnit * quantity * contractMultiplier);
    }
    
    let realizedR2R = 0;
    if (exitPrice !== null && stopLoss !== null && entryPrice) {
      const gain = action === "buy" 
        ? exitPrice - entryPrice 
        : entryPrice - exitPrice;
      const risk = action === "buy" 
        ? entryPrice - stopLoss 
        : stopLoss - entryPrice;
      
      if (risk > 0) {
        realizedR2R = Math.abs(gain / risk);
      }
    }
    
    // Calculate gross P&L (before fees)
    const grossPnl = netPnl;
    
    // Net P&L is gross P&L minus fees (ensure fees are positive)
    const finalNetPnl = netPnl - Math.abs(fees);
    
    return {
      netPnl: finalNetPnl,
      percentGain,
      tradeRisk,
      realizedR2R,
      grossPnl
    };
  };

  return calculateValues();
}
