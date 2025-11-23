
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { EnhancedTradeFormValues } from "../EnhancedTradeFormSchema";

interface BasicTradeFieldsProps {
  form: UseFormReturn<EnhancedTradeFormValues>;
  watchMarketType: string;
}

export function BasicTradeFields({ form, watchMarketType }: BasicTradeFieldsProps) {
  return (
    <>
      {/* Market Type, Symbol, Contract Multiplier, Target, Stop Loss - Single row for desktop */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <FormField
          control={form.control}
          name="marketType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Market Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select market type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Spot">Spot</SelectItem>
                  <SelectItem value="Futures">Futures</SelectItem>
                  <SelectItem value="Options">Options</SelectItem>
                  <SelectItem value="Forex">Forex</SelectItem>
                  <SelectItem value="Crypto">Crypto</SelectItem>
                  <SelectItem value="Stock">Stock</SelectItem>
                  <SelectItem value="Commodities">Commodities</SelectItem>
                  <SelectItem value="Indices">Indices</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="symbol"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Symbol</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., AAPL, EURUSD" 
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  style={{ textTransform: 'uppercase' }}
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
                  step="any"
                  placeholder="1"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
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
              <FormLabel>Target</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
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
              <FormLabel>Stop Loss</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Long/Short Toggle for Options */}
      {watchMarketType === "Options" && (
        <FormField
          control={form.control}
          name="isLong"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Position Direction</FormLabel>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={field.value ? "default" : "outline"}
                  onClick={() => field.onChange(true)}
                  className={cn(
                    "flex-1",
                    field.value && "bg-green-500 hover:bg-green-600 text-white"
                  )}
                >
                  Long
                </Button>
                <Button
                  type="button"
                  variant={!field.value ? "default" : "outline"}
                  onClick={() => field.onChange(false)}
                  className={cn(
                    "flex-1",
                    !field.value && "bg-red-500 hover:bg-red-600 text-white"
                  )}
                >
                  Short
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Tick Size & Tick Value for Futures */}
      {watchMarketType === "Futures" && (
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tickSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tick Size</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    placeholder="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tickValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tick Value</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    placeholder="1.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </>
  );
}
