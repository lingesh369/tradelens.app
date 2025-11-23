
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { TradeFormValues } from "../TradeFormSchema";

interface TradeFeeFieldsProps {
  form: UseFormReturn<TradeFormValues>;
}

export function TradeFeeFields({ form }: TradeFeeFieldsProps) {
  const handleCommissionChange = (value: string) => {
    const numValue = value === "" ? 0 : Number(value);
    // Always convert to positive value
    form.setValue("commission", Math.abs(numValue));
  };

  const handleFeesChange = (value: string) => {
    const numValue = value === "" ? 0 : Number(value);
    // Always convert to positive value
    form.setValue("fees", Math.abs(numValue));
  };

  return (
    <>
      <FormField
        control={form.control}
        name="commission"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Commission</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min="0" 
                step="0.01" 
                placeholder="0.00"
                value={field.value === undefined ? "0" : field.value}
                onChange={e => handleCommissionChange(e.target.value)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="fees"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Additional Fees</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min="0" 
                step="0.01"
                placeholder="0.00" 
                value={field.value === undefined ? "0" : field.value}
                onChange={e => handleFeesChange(e.target.value)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
