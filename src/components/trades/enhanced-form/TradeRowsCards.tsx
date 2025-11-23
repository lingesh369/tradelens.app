
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { FormField, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EnhancedTradeFormValues, TradeRow } from "../EnhancedTradeFormSchema";

interface TradeRowsCardsProps {
  form: UseFormReturn<EnhancedTradeFormValues>;
  watchTradeRows: TradeRow[];
  calculateRemainingQuantity: (index: number) => number;
  removeTradeRow: (index: number) => void;
  handleQuantityChange: (index: number, value: number) => void;
}

export function TradeRowsCards({
  form,
  watchTradeRows = [],
  calculateRemainingQuantity,
  removeTradeRow,
  handleQuantityChange,
}: TradeRowsCardsProps) {
  // Helper function to determine if a row is an exit row
  const isExitRow = (index: number): boolean => {
    if (!watchTradeRows || watchTradeRows.length === 0) return false;
    const mainAction = watchTradeRows[0]?.action;
    const currentAction = watchTradeRows[index]?.action;
    return currentAction !== mainAction;
  };

  // Helper function to get the display text for remaining quantity
  const getRemainingQuantityText = (index: number): string => {
    if (!isExitRow(index)) return "";
    const remaining = calculateRemainingQuantity(index);
    return `Remaining: ${remaining}`;
  };

  // Ensure arrays are valid before rendering
  const validTradeRows = Array.isArray(watchTradeRows) ? watchTradeRows : [];

  return (
    <div className="md:hidden space-y-4">
      {validTradeRows.map((row, index) => (
        <div key={row.id} className="border rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-start">
            {/* Single Toggle Action Button */}
            <FormField
              control={form.control}
              name={`tradeRows.${index}.action`}
              render={({ field }) => (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => field.onChange(field.value === "buy" ? "sell" : "buy")}
                  className={cn(
                    "min-w-16 transition-all duration-200",
                    field.value === "buy" 
                      ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-800/30" 
                      : "bg-red-100 text-red-800 border-red-300 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-800/30"
                  )}
                >
                  {field.value === "buy" ? "BUY" : "SELL"}
                </Button>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeTradeRow(index)}
              disabled={validTradeRows.length <= 1}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Date & Time in same row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Date</label>
              <FormField
                control={form.control}
                name={`tradeRows.${index}.date`}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "w-full text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "MMM dd") : "Date"}
                        <CalendarIcon className="ml-auto h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Time</label>
              <FormField
                control={form.control}
                name={`tradeRows.${index}.time`}
                render={({ field }) => (
                  <Input type="time" {...field} />
                )}
              />
            </div>
          </div>

          {/* Quantity, Price, Fee in same row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Quantity</label>
              <FormField
                control={form.control}
                name={`tradeRows.${index}.quantity`}
                render={({ field }) => (
                  <div>
                    <Input
                      type="number"
                      step="any"
                      placeholder="0"
                      {...field}
                      onChange={(e) => handleQuantityChange(index, parseFloat(e.target.value) || 0)}
                    />
                    {isExitRow(index) && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {getRemainingQuantityText(index)}
                      </Badge>
                    )}
                  </div>
                )}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Price</label>
              <FormField
                control={form.control}
                name={`tradeRows.${index}.price`}
                render={({ field }) => (
                  <Input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                )}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Fee</label>
              <FormField
                control={form.control}
                name={`tradeRows.${index}.fee`}
                render={({ field }) => (
                  <Input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                )}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
