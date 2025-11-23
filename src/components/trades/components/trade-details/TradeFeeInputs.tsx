
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";

interface TradeFeeInputsProps {
  commission: number;
  fees: number;
  isReadOnly?: boolean;
  onCommissionChange: (value: number) => void;
  onFeesChange: (value: number) => void;
}

export function TradeFeeInputs({
  commission,
  fees,
  isReadOnly = false,
  onCommissionChange,
  onFeesChange
}: TradeFeeInputsProps) {
  const { settings } = useGlobalSettings();
  const currency = settings?.base_currency || "USD";

  const handleCommissionChange = (value: number) => {
    // Always convert to positive value
    onCommissionChange(Math.abs(value));
  };

  const handleFeesChange = (value: number) => {
    // Always convert to positive value
    onFeesChange(Math.abs(value));
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Fees & Commissions</h4>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="commission">Commission ({currency})</Label>
          {isReadOnly ? (
            <div className="px-3 py-2 bg-muted rounded-md text-sm">
              {commission}
            </div>
          ) : (
            <Input
              id="commission"
              type="number"
              step="0.01"
              min="0"
              value={commission}
              onChange={(e) => handleCommissionChange(Number(e.target.value))}
              placeholder="0.00"
            />
          )}
        </div>
        
        <div>
          <Label htmlFor="fees">Additional Fees ({currency})</Label>
          {isReadOnly ? (
            <div className="px-3 py-2 bg-muted rounded-md text-sm">
              {fees}
            </div>
          ) : (
            <Input
              id="fees"
              type="number"
              step="0.01"
              min="0"
              value={fees}
              onChange={(e) => handleFeesChange(Number(e.target.value))}
              placeholder="0.00"
            />
          )}
        </div>
      </div>
    </div>
  );
}
