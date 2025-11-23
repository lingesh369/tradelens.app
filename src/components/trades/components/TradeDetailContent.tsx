
import { TradeTimeline } from "./TradeTimeline";
import { TradeDetailLayout } from "./TradeDetailLayout";
import { TradeDetailDesktop } from "./TradeDetailDesktop";
import { TradeDetailMobile } from "./TradeDetailMobile";
import { useTradeTimelineData } from "./useTradeTimelineData";
import { Account } from "@/hooks/useAccounts";
import { Strategy } from "@/hooks/useStrategies";
import { Tag } from "@/hooks/useTags";

interface TradeDetailContentProps {
  // Timeline props
  entryDate: string;
  exitDate?: string;
  entryPrice: number;
  exitPrice?: number | null;
  action: string;
  quantity: number;
  target?: number | null;
  stopLoss?: number | null;
  partialExits: Array<{
    action: string;
    datetime: string;
    quantity: number;
    price: number;
    fee: number;
  }>;
  
  // Trade details props
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
  
  // Trade analysis props
  tradeNotes: string;
  images: string[];
  hasChanges: boolean;
  mainImage: string;
  additionalImages: string[];
  
  // Read-only mode
  isReadOnly?: boolean;
  
  // Shared trade owner data
  sharedTradeOwnerData?: {
    accounts: Account[];
    strategies: Strategy[];
    tags: Tag[];
  };
  
  // Event handlers
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

export function TradeDetailContent({
  entryDate,
  exitDate,
  entryPrice,
  exitPrice,
  action,
  quantity,
  target,
  stopLoss,
  partialExits,
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
  mainImage,
  additionalImages,
  isReadOnly = false,
  sharedTradeOwnerData,
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
}: TradeDetailContentProps) {
  const { timelineExitDate } = useTradeTimelineData({
    exitDate,
    editValues,
    partialExits
  });

  // Use shared trade owner data if available, otherwise use regular data
  const effectiveAccounts = sharedTradeOwnerData?.accounts || accounts;
  const effectiveStrategies = sharedTradeOwnerData?.strategies || strategies;
  const effectiveTags = sharedTradeOwnerData?.tags || allTags;

  const sharedProps = {
    editValues,
    accounts: effectiveAccounts,
    strategies: effectiveStrategies,
    allTags: effectiveTags,
    selectedTimeframe,
    selectedAccount,
    selectedStrategy,
    selectedTags,
    tradeId,
    tradeRating,
    tradeNotes,
    images,
    hasChanges,
    isReadOnly,
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
  };

  return (
    <TradeDetailLayout
      timeline={
        <TradeTimeline
          entryDate={entryDate}
          exitDate={timelineExitDate}
          entryPrice={entryPrice}
          exitPrice={exitPrice}
          action={action}
          quantity={quantity}
          target={target}
          stopLoss={stopLoss}
          partialExits={partialExits}
        />
      }
      desktopContent={<TradeDetailDesktop {...sharedProps} />}
      mobileContent={<TradeDetailMobile {...sharedProps} />}
    />
  );
}
