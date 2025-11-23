
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { TradeFormValues } from "../TradeFormSchema";
import { AccountSelector } from "./AccountSelector";

interface TradeBasicInfoFieldsProps {
  form: UseFormReturn<TradeFormValues>;
  accounts: { account_id: string; account_name: string }[];
  strategies: { strategy_id: string; strategy_name: string }[];
  watchMarketType: string;
}

export function TradeBasicInfoFields({ form, accounts, strategies, watchMarketType }: TradeBasicInfoFieldsProps) {
  // Updated to use standardized market types
  const marketTypes = ["Stock", "Forex", "Crypto", "Options", "Futures", "Commodities", "Indices"];
  
  return (
    <>
      <AccountSelector form={form} accounts={accounts} />

      <FormField
        control={form.control}
        name="strategyId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Strategy</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              value={field.value || ""}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select Strategy" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {strategies.map((strategy) => (
                  <SelectItem 
                    key={strategy.strategy_id} 
                    value={strategy.strategy_id}
                  >
                    {strategy.strategy_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="marketType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Market Type</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              value={field.value || ""}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select Market Type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {marketTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="instrument"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Instrument</FormLabel>
            <FormControl>
              <Input placeholder="e.g. AAPL, BTC, EUR/USD" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="contract"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Contract (Optional)</FormLabel>
            <FormControl>
              <Input 
                placeholder={
                  watchMarketType === "Options" 
                    ? "e.g. SPY 400c 06/15" 
                    : watchMarketType === "Futures" 
                      ? "e.g. ES 06/23" 
                      : ""
                } 
                {...field} 
                value={field.value || ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="action"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Action</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select Action" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="quantity"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Quantity</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min="0.000001" 
                step="0.000001" 
                value={field.value === undefined ? "" : field.value}
                onChange={e => field.onChange(e.target.value === "" ? undefined : e.target.value)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
