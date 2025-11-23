
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BarChart3, ChevronRight } from "lucide-react";

interface StrategyCardProps {
  id: string;
  name: string;
  description: string;
  winRate: number;
  totalTrades: number;
  pnl: number;
  className?: string;
  onViewDetails?: () => void;
}

export function StrategyCard({
  id,
  name,
  description,
  winRate,
  totalTrades,
  pnl,
  className,
  onViewDetails,
}: StrategyCardProps) {
  // Format the values for display
  const formattedWinRate = isNaN(winRate) ? 0 : Math.round(winRate);
  const formattedTotalTrades = isNaN(totalTrades) ? 0 : totalTrades;
  const formattedPnl = isNaN(pnl) ? 0 : pnl;

  // Format P&L with 2 decimal places
  const formatPnL = (value: number): string => {
    return value.toFixed(2);
  };

  return (
    <div className={cn("glass-card rounded-xl overflow-hidden transition-all hover:shadow-elevated group", className)}>
      <div className="p-5 flex flex-col h-full">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="bg-primary/10 rounded-full p-2">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-6 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <p className="text-xl font-bold mt-1">{formattedWinRate}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Trades</p>
            <p className="text-xl font-bold mt-1">{formattedTotalTrades}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">P&L</p>
            <p className={cn(
              "text-xl font-bold mt-1",
              formattedPnl > 0 ? "profit-text" : formattedPnl < 0 ? "loss-text" : ""
            )}>
              {formattedPnl > 0 ? "+" : ""}${formatPnL(Math.abs(formattedPnl))}
            </p>
          </div>
        </div>
        
        <div className="mt-auto pt-6">
          <Button 
            variant="ghost" 
            className="w-full justify-between"
            onClick={onViewDetails}
          >
            <span>View Details</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
