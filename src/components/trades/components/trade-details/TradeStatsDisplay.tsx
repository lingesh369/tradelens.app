
import { cn } from "@/lib/utils";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { formatCurrencyValue } from "@/lib/currency-data";

interface TradeStatsProps {
  netPnl: number;
  percentGain: number;
  grossPnl: number;
  fees: number;
  tradeRisk: number;
  realizedR2R: number;
}

export function TradeStatsDisplay({
  netPnl,
  percentGain,
  grossPnl,
  fees,
  tradeRisk,
  realizedR2R
}: TradeStatsProps) {
  const { settings } = useGlobalSettings();
  
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-sm text-muted-foreground">Net P&L</p>
        <p className={cn(
          "text-lg font-semibold",
          netPnl > 0 ? "text-green-500" : netPnl < 0 ? "text-red-500" : ""
        )}>
          {`${netPnl > 0 ? "+" : ""}`}{formatCurrencyValue(Math.abs(netPnl), settings?.base_currency || "USD")}
        </p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Commissions & Fees</p>
        <p className="text-lg font-semibold">
          {formatCurrencyValue(Math.abs(fees), settings?.base_currency || "USD")}
        </p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">% Gain</p>
        <p className={cn(
          "text-lg font-semibold",
          percentGain > 0 ? "text-green-500" : percentGain < 0 ? "text-red-500" : ""
        )}>
          {`${percentGain > 0 ? "+" : ""}${percentGain.toFixed(2)}%`}
        </p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Gross P&L</p>
        <p className={cn(
          "text-lg font-semibold",
          grossPnl > 0 ? "text-green-500" : grossPnl < 0 ? "text-red-500" : ""
        )}>
          {`${grossPnl > 0 ? "+" : ""}`}{formatCurrencyValue(Math.abs(grossPnl), settings?.base_currency || "USD")}
        </p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Trade Risk</p>
        <p className="text-lg font-semibold">
          {formatCurrencyValue(tradeRisk, settings?.base_currency || "USD")}
        </p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Realized R2R</p>
        <p className="text-lg font-semibold">
          {realizedR2R.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
