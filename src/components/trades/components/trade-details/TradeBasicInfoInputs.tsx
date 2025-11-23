
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TradeBasicInfoInputsProps {
  instrument: string;
  action: string;
  marketType: string;
  quantity: number;
  contractMultiplier: number;
  onInstrumentChange: (value: string) => void;
  onActionChange: (value: string) => void;
  onMarketTypeChange: (value: string) => void;
  onQuantityChange: (value: number) => void;
  onContractMultiplierChange: (value: number) => void;
  disabled?: boolean;
}

const MARKET_TYPES = [
  "Stock", "Option", "Future", "Forex", "Crypto", "Index", "ETF", "Bond", "Commodity"
];

export function TradeBasicInfoInputs({
  instrument,
  action,
  marketType,
  quantity,
  contractMultiplier,
  onInstrumentChange,
  onActionChange,
  onMarketTypeChange,
  onQuantityChange,
  onContractMultiplierChange,
  disabled = false
}: TradeBasicInfoInputsProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Basic Information</h4>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="instrument">Instrument/Symbol</Label>
          <Input
            id="instrument"
            value={instrument}
            onChange={(e) => onInstrumentChange(e.target.value)}
            placeholder="e.g., AAPL, EURUSD"
            disabled={disabled}
          />
        </div>
        
        <div>
          <Label htmlFor="action">Action</Label>
          <Select value={action} onValueChange={onActionChange} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Select action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="market-type">Market Type</Label>
          <Select value={marketType} onValueChange={onMarketTypeChange} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {MARKET_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            step="0.01"
            min="0"
            value={quantity}
            onChange={(e) => onQuantityChange(Number(e.target.value))}
            placeholder="0"
            disabled={disabled}
          />
        </div>
        
        <div>
          <Label htmlFor="multiplier">Contract Multiplier</Label>
          <Input
            id="multiplier"
            type="number"
            step="0.01"
            min="0"
            value={contractMultiplier}
            onChange={(e) => onContractMultiplierChange(Number(e.target.value))}
            placeholder="1"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
