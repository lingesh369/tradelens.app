
import { Input } from "@/components/ui/input";

interface TradePriceInputsProps {
  entryPrice: number;
  exitPrice: number | null;
  target: number | null;
  stopLoss: number | null;
  isReadOnly?: boolean;
  onEntryPriceChange: (value: number) => void;
  onExitPriceChange: (value: number | null) => void;
  onTargetChange: (value: number | null) => void;
  onStopLossChange: (value: number | null) => void;
}

export function TradePriceInputs({
  entryPrice,
  exitPrice,
  target,
  stopLoss,
  isReadOnly = false,
  onEntryPriceChange,
  onExitPriceChange,
  onTargetChange,
  onStopLossChange
}: TradePriceInputsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-sm text-muted-foreground">Entry Price</p>
        {isReadOnly ? (
          <div className="px-3 py-2 bg-muted rounded-md text-sm mt-1">
            {entryPrice || 0}
          </div>
        ) : (
          <Input
            type="number"
            step="0.0000001"
            value={entryPrice}
            onChange={(e) => onEntryPriceChange(parseFloat(e.target.value) || 0)}
            className="mt-1"
          />
        )}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Exit Price</p>
        {isReadOnly ? (
          <div className="px-3 py-2 bg-muted rounded-md text-sm mt-1">
            {exitPrice || "Not set"}
          </div>
        ) : (
          <Input
            type="number"
            step="0.0000001"
            value={exitPrice || ''}
            onChange={(e) => onExitPriceChange(e.target.value ? parseFloat(e.target.value) : null)}
            className="mt-1"
          />
        )}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Target Price</p>
        {isReadOnly ? (
          <div className="px-3 py-2 bg-muted rounded-md text-sm mt-1">
            {target || "Not set"}
          </div>
        ) : (
          <Input
            type="number"
            step="0.0000001"
            value={target || ''}
            onChange={(e) => onTargetChange(e.target.value ? parseFloat(e.target.value) : null)}
            className="mt-1"
          />
        )}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Stop Loss</p>
        {isReadOnly ? (
          <div className="px-3 py-2 bg-muted rounded-md text-sm mt-1">
            {stopLoss || "Not set"}
          </div>
        ) : (
          <Input
            type="number"
            step="0.0000001"
            value={stopLoss || ''}
            onChange={(e) => onStopLossChange(e.target.value ? parseFloat(e.target.value) : null)}
            className="mt-1"
          />
        )}
      </div>
    </div>
  );
}
