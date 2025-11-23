
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface BillingCycleToggleProps {
  isYearly: boolean;
  onChange: (isYearly: boolean) => void;
}

export function BillingCycleToggle({ isYearly, onChange }: BillingCycleToggleProps) {
  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="flex items-center space-x-2">
        <Label 
          htmlFor="billing-toggle" 
          className={`transition-colors ${isYearly ? "text-muted-foreground" : "font-medium"}`}
        >
          Monthly
        </Label>
        <Switch
          id="billing-toggle"
          checked={isYearly}
          onCheckedChange={onChange}
          className="data-[state=checked]:bg-green-600"
        />
        <Label 
          htmlFor="billing-toggle" 
          className={`transition-colors ${!isYearly ? "text-muted-foreground" : "font-medium"}`}
        >
          Yearly <span className="ml-1 text-xs text-green-600 font-medium">Save 17%</span>
        </Label>
      </div>
    </div>
  );
}
