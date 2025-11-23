
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Trade } from "@/hooks/useTrades";
import { format, parseISO } from "date-fns";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { formatCurrencyValue } from "@/lib/currency-data";

interface RecentTradesProps {
  className?: string;
  compact?: boolean;
  trades?: Trade[];
}

export function RecentTrades({ className, compact = false, trades = [] }: RecentTradesProps) {
  const navigate = useNavigate();
  const { settings } = useGlobalSettings();
  
  const handleTradeClick = (tradeId: string) => {
    navigate(`/trades/${tradeId}`);
  };

  const sortedTrades = [...trades].sort((a, b) => {
    const aDate = a.entry_time ? new Date(a.entry_time).getTime() : 0;
    const bDate = b.entry_time ? new Date(b.entry_time).getTime() : 0;
    return bDate - aDate;
  });
  
  const displayTrades = compact ? sortedTrades.slice(0, 5) : sortedTrades;

  return (
    <div className={cn("glass-card rounded-xl overflow-hidden", className)}>
      <div className="flex items-center justify-between p-2 border-b">
        <h3 className="text-base font-medium">Recent Trades</h3>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/trades" className="flex items-center gap-1 text-xs">
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </Button>
      </div>
      
      <div className="divide-y max-h-[calc(100%-2.5rem)] overflow-y-auto">
        {displayTrades.length > 0 ? (
          displayTrades.map((trade) => (
            <div 
              key={trade.trade_id} 
              className="flex items-center justify-between p-2 hover:bg-muted/20 transition-colors cursor-pointer"
              onClick={() => handleTradeClick(trade.trade_id)}
            >
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">{trade.instrument}</span>
                    <Badge variant={trade.action.toLowerCase() === "buy" ? "default" : "secondary"} className="text-[0.6rem] py-0 px-1">
                      {trade.action.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {trade.entry_time ? format(parseISO(trade.entry_time), "MMM dd, yyyy") : "No date"}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <span 
                  className={cn(
                    "font-medium text-right",
                    (trade.net_pl || 0) > 0 ? "profit-text" : (trade.net_pl || 0) < 0 ? "loss-text" : ""
                  )}
                >
                  {(trade.net_pl || 0) > 0 ? "+" : ""}
                  {formatCurrencyValue(Math.abs(trade.net_pl || 0), settings?.base_currency || "USD")}
                </span>
                <span 
                  className={cn(
                    "text-xs",
                    (trade.percent_gain || 0) > 0 ? "profit-text" : (trade.percent_gain || 0) < 0 ? "loss-text" : ""
                  )}
                >
                  {(trade.percent_gain || 0) > 0 ? "+" : ""}{(trade.percent_gain || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            No trades found. Add your first trade to see it here.
          </div>
        )}
      </div>
    </div>
  );
}
