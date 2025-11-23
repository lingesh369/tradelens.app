
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { TradeStatsDisplay } from "./trade-details/TradeStatsDisplay";
import { TradeManagementSection } from "./trade-details/TradeManagementSection";
import { useTradeCalculations } from "./trade-details/useTradeCalculations";
import { Account } from "@/hooks/useAccounts";
import { Strategy } from "@/hooks/useStrategies";
import { Tag } from "@/hooks/useTags";

interface TradeDetailsCardProps {
  // Props needed for calculations
  action: string;
  quantity: number;
  contractMultiplier: number;
  entryPrice: number;
  exitPrice: number | null;
  stopLoss: number | null;
  commission: number;
  fees: number;
  
  // Props needed for trade management section
  accounts: Account[];
  strategies: Strategy[];
  tags?: Tag[];
  selectedAccount: string;
  selectedStrategy: string;
  selectedTimeframe: string;
  selectedTags?: string[];
  tradeRating?: number;
  isReadOnly?: boolean;
  onEdit?: () => void;
  
  // Handlers for trade management section
  onAccountChange: (value: string) => void;
  onTimeframeChange: (value: string) => void;
  onStrategyChange: (value: string) => void;
  onTagsChange?: (value: string[]) => void;
  onTradeRatingChange?: (value: number) => void;
}

export function TradeDetailsCard({
  action,
  quantity,
  contractMultiplier,
  entryPrice,
  exitPrice,
  stopLoss,
  commission,
  fees,
  accounts,
  strategies,
  tags = [],
  selectedAccount,
  selectedStrategy,
  selectedTimeframe,
  selectedTags = [],
  tradeRating = 0,
  isReadOnly = false,
  onEdit,
  onAccountChange,
  onTimeframeChange,
  onStrategyChange,
  onTagsChange = () => {},
  onTradeRatingChange = () => {}
}: TradeDetailsCardProps) {
  // Calculate all trade values using the custom hook
  const calculatedValues = useTradeCalculations({
    entryPrice,
    exitPrice,
    stopLoss,
    quantity,
    fees: commission + fees,
    action,
    contractMultiplier
  });

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg sm:text-xl">Trade Details</CardTitle>
          {!isReadOnly && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-9 w-9 p-0 sm:h-8 sm:w-8 touch-manipulation"
              title="Edit trade details"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {/* Stats Display Section */}
        <TradeStatsDisplay
          netPnl={calculatedValues.netPnl}
          percentGain={calculatedValues.percentGain}
          grossPnl={calculatedValues.grossPnl}
          fees={commission + fees}
          tradeRisk={calculatedValues.tradeRisk}
          realizedR2R={calculatedValues.realizedR2R}
        />

        {/* Trade Management Fields Section */}
        <div className="pt-4 border-t space-y-4">
          <TradeManagementSection
            accounts={accounts}
            strategies={strategies}
            tags={tags}
            selectedAccount={selectedAccount}
            selectedTimeframe={selectedTimeframe}
            selectedStrategy={selectedStrategy}
            selectedTags={selectedTags}
            tradeRating={tradeRating}
            isReadOnly={isReadOnly}
            onAccountChange={onAccountChange}
            onTimeframeChange={onTimeframeChange}
            onStrategyChange={onStrategyChange}
            onTagsChange={onTagsChange}
            onTradeRatingChange={onTradeRatingChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
