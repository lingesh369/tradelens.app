
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Target, StopCircle } from "lucide-react";
import { Trade } from "@/types/trade";

interface TradeTimelineBarProps {
  trade: Trade;
  formatCurrency?: (amount: number) => string;
}

export function TradeTimelineBar({ trade, formatCurrency = (amount) => `$${amount.toFixed(2)}` }: TradeTimelineBarProps) {
  const isLong = trade.action.toLowerCase() === "buy";
  
  const EntryIcon = isLong ? ArrowUp : ArrowDown;
  const ExitIcon = isLong ? ArrowDown : ArrowUp;
  
  const entryColor = isLong ? "text-green-600" : "text-red-600";
  const exitColor = isLong ? "text-red-600" : "text-green-600";
  
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Entry Information */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-full bg-gray-100 ${entryColor}`}>
                <EntryIcon className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={isLong ? "default" : "destructive"} className="text-xs">
                    {isLong ? "BUY" : "SELL"}
                  </Badge>
                  <span className="text-sm font-medium">{trade.quantity}</span>
                  <span className="text-sm text-muted-foreground">@</span>
                  <span className="text-sm font-medium">{formatCurrency(trade.entry_price)}</span>
                </div>
                <div className="text-xs text-muted-foreground">Entry</div>
              </div>
            </div>
          </div>

          {/* Timeline Connector */}
          <div className="flex-1 min-w-[60px] mx-4">
            <div className="h-0.5 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 relative">
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-gray-400 rounded-full"></div>
              {trade.exit_price && (
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-gray-400 rounded-full"></div>
              )}
            </div>
          </div>

          {/* Exit Information */}
          {trade.exit_price ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-full bg-gray-100 ${exitColor}`}>
                  <ExitIcon className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isLong ? "destructive" : "default"} className="text-xs">
                      {isLong ? "SELL" : "BUY"}
                    </Badge>
                    <span className="text-sm font-medium">
                      {trade.total_exit_quantity || trade.quantity}
                    </span>
                    <span className="text-sm text-muted-foreground">@</span>
                    <span className="text-sm font-medium">{formatCurrency(trade.exit_price)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {trade.status === "partially_closed" ? "Partial Exit" : "Exit"}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                OPEN
              </Badge>
            </div>
          )}
        </div>

        {/* Target and Stop Loss Row */}
        {(trade.target || trade.sl) && (
          <div className="flex items-center gap-6 mt-4 pt-4 border-t">
            {trade.target && (
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-green-100 text-green-600">
                  <Target className="h-3 w-3" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Target (TP)</div>
                  <div className="text-sm font-medium">{formatCurrency(trade.target)}</div>
                </div>
              </div>
            )}
            
            {trade.sl && (
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-red-100 text-red-600">
                  <StopCircle className="h-3 w-3" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Stop Loss (SL)</div>
                  <div className="text-sm font-medium">{formatCurrency(trade.sl)}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status Badge for Partial Exits */}
        {trade.status === "partially_closed" && trade.remaining_quantity && (
          <div className="mt-3 pt-3 border-t">
            <Badge variant="secondary" className="text-xs">
              Remaining: {trade.remaining_quantity} {trade.instrument}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
