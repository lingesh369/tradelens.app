
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

interface TradeRowsTableProps {
  form: UseFormReturn<EnhancedTradeFormValues>;
  watchTradeRows: TradeRow[];
  calculateRemainingQuantity: (index: number) => number;
  removeTradeRow: (index: number) => void;
  handleQuantityChange: (index: number, value: number) => void;
}

export function TradeRowsTable({
  form,
  watchTradeRows = [],
  calculateRemainingQuantity,
  removeTradeRow,
  handleQuantityChange,
}: TradeRowsTableProps) {
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
    <div className="hidden md:block">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2 font-medium">Action</th>
              <th className="text-left p-2 font-medium">Date/Time</th>
              <th className="text-left p-2 font-medium">Quantity</th>
              <th className="text-left p-2 font-medium">Price</th>
              <th className="text-left p-2 font-medium">Fee</th>
              <th className="text-left p-2 font-medium w-12"></th>
            </tr>
          </thead>
          <tbody>
            {validTradeRows.map((row, index) => (
              <tr key={row.id} className="border-b">
                {/* Single Toggle Action Button */}
                <td className="p-2">
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
                </td>

                {/* Date/Time */}
                <td className="p-2">
                  <div className="flex gap-2">
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
                                "text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "MMM dd") : "Date"}
                              <CalendarIcon className="ml-2 h-3 w-3" />
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
                    <FormField
                      control={form.control}
                      name={`tradeRows.${index}.time`}
                      render={({ field }) => (
                        <Input
                          type="time"
                          size={8}
                          className="w-24"
                          {...field}
                        />
                      )}
                    />
                  </div>
                </td>

                {/* Quantity */}
                <td className="p-2">
                  <FormField
                    control={form.control}
                    name={`tradeRows.${index}.quantity`}
                    render={({ field }) => (
                      <div>
                        <Input
                          type="number"
                          step="any"
                          placeholder="0"
                          className="w-24"
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
                </td>

                {/* Price */}
                <td className="p-2">
                  <FormField
                    control={form.control}
                    name={`tradeRows.${index}.price`}
                    render={({ field }) => (
                      <Input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        className="w-24"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    )}
                  />
                </td>

                {/* Fee */}
                <td className="p-2">
                  <FormField
                    control={form.control}
                    name={`tradeRows.${index}.fee`}
                    render={({ field }) => (
                      <Input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        className="w-24"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    )}
                  />
                </td>

                {/* Delete Button */}
                <td className="p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTradeRow(index)}
                    disabled={validTradeRows.length <= 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
