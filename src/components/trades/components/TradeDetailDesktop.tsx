
import { TradeDetailsCard } from "./TradeDetailsCard";
import { TradeAnalysisCard } from "./TradeAnalysisCard";
import { Account } from "@/hooks/useAccounts";
import { Strategy } from "@/hooks/useStrategies";
import { Tag } from "@/hooks/useTags";

interface TradeDetailDesktopProps {
  editValues: {
    instrument: string;
    action: string;
    marketType: string;
    quantity: number;
    contractMultiplier: number;
    entryDate: string;
    entryTime: string;
    exitDate: string | null;
    exitTime: string | null;
    entryPrice: number;
    exitPrice: number | null;
    stopLoss: number | null;
    target: number | null;
    commission: number;
    fees: number;
  };
  accounts: Account[];
  strategies: Strategy[];
  allTags: Tag[];
  selectedTimeframe: string;
  selectedAccount: string;
  selectedStrategy: string;
  selectedTags: string[];
  tradeId: string;
  tradeRating: number;
  tradeNotes: string;
  images: string[];
  hasChanges: boolean;
  isReadOnly?: boolean;
  onEdit?: () => void;
  onEditValuesChange: (key: string, value: any) => void;
  onSelectedTimeframeChange: (value: string) => void;
  onSelectedAccountChange: (value: string) => void;
  onSelectedStrategyChange: (value: string) => void;
  onSelectedTagsChange: (value: string[]) => void;
  onTradeRatingChange: (value: number) => void;
  onTradeNotesChange: (value: string) => void;
  onImagesChange: (images: string[]) => void;
  onSave: () => void;
}

export function TradeDetailDesktop({
  editValues,
  accounts,
  strategies,
  allTags,
  selectedTimeframe,
  selectedAccount,
  selectedStrategy,
  selectedTags,
  tradeId,
  tradeRating,
  tradeNotes,
  images,
  hasChanges,
  isReadOnly = false,
  onEdit,
  onEditValuesChange,
  onSelectedTimeframeChange,
  onSelectedAccountChange,
  onSelectedStrategyChange,
  onSelectedTagsChange,
  onTradeRatingChange,
  onTradeNotesChange,
  onImagesChange,
  onSave
}: TradeDetailDesktopProps) {
  return (
    <>
      <div className="col-span-1 space-y-6">
        <TradeDetailsCard
          action={editValues.action}
          quantity={editValues.quantity}
          contractMultiplier={editValues.contractMultiplier}
          entryPrice={editValues.entryPrice}
          exitPrice={editValues.exitPrice}
          stopLoss={editValues.stopLoss}
          commission={editValues.commission}
          fees={editValues.fees}
          accounts={accounts}
          strategies={strategies}
          tags={allTags}
          selectedAccount={selectedAccount}
          selectedStrategy={selectedStrategy}
          selectedTimeframe={selectedTimeframe}
          selectedTags={selectedTags}
          tradeRating={tradeRating}
          isReadOnly={isReadOnly}
          onEdit={onEdit}
          onAccountChange={onSelectedAccountChange}
          onTimeframeChange={onSelectedTimeframeChange}
          onStrategyChange={onSelectedStrategyChange}
          onTagsChange={onSelectedTagsChange}
          onTradeRatingChange={onTradeRatingChange}
        />
      </div>
      
      <div className="col-span-2">
        <TradeAnalysisCard
          tradeId={tradeId}
          notes={tradeNotes}
          images={images}
          hasChanges={hasChanges}
          onNotesChange={onTradeNotesChange}
          onImagesChange={onImagesChange}
          onSave={onSave}
          isReadOnly={isReadOnly}
          isSharedTrade={isReadOnly}
        />
      </div>
    </>
  );
}
