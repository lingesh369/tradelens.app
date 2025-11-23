
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { TradeFormValues } from "../TradeFormSchema";

interface TradePriceFieldsProps {
  form: UseFormReturn<TradeFormValues>;
}

export function TradePriceFields({ form }: TradePriceFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="entryPrice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Entry Price</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min="0" 
                step="0.0000001" 
                {...field} 
                value={field.value === undefined ? "" : field.value}
                onChange={e => field.onChange(e.target.value === "" ? undefined : e.target.value)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="stopLoss"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Stop Loss (Optional)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min="0" 
                step="0.0000001" 
                value={field.value === undefined ? "" : field.value}
                onChange={e => field.onChange(e.target.value === "" ? undefined : e.target.value)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="target"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Target Price (Optional)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min="0" 
                step="0.0000001" 
                value={field.value === undefined ? "" : field.value}
                onChange={e => field.onChange(e.target.value === "" ? undefined : e.target.value)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="exitPrice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Exit Price (Optional)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min="0" 
                step="0.0000001"
                value={field.value === undefined ? "" : field.value}
                onChange={e => field.onChange(e.target.value === "" ? undefined : e.target.value)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="contractMultiplier"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Contract Multiplier</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min="0" 
                step="0.0000001" 
                placeholder="1"
                value={field.value === undefined ? "" : field.value}
                onChange={e => field.onChange(e.target.value === "" ? 1 : e.target.value)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
