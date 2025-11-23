
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnhancedTradeFormValues, TradeRow } from "../EnhancedTradeFormSchema";
import { AccountStrategySelector } from "./AccountStrategySelector";
import { BasicTradeFields } from "./BasicTradeFields";
import { TradeRowsTable } from "./TradeRowsTable";
import { TradeRowsCards } from "./TradeRowsCards";

interface TradeDetailsTabProps {
  form: UseFormReturn<EnhancedTradeFormValues>;
  accounts: any[];
  strategies: any[];
  watchMarketType: string;
  watchTradeRows: TradeRow[];
  calculateRemainingQuantity: (index: number) => number;
  addTradeRow: () => void;
  removeTradeRow: (index: number) => void;
}

export function TradeDetailsTab({
  form,
  accounts = [],
  strategies = [],
  watchMarketType,
  watchTradeRows = [],
  calculateRemainingQuantity,
  addTradeRow,
  removeTradeRow,
}: TradeDetailsTabProps) {
  
  // Auto-populate remaining quantity for exit rows
  const handleQuantityChange = (index: number, value: number) => {
    form.setValue(`tradeRows.${index}.quantity`, value);
  };

  // Helper function to determine if a row is an exit row
  const isExitRow = (index: number): boolean => {
    if (!watchTradeRows || watchTradeRows.length === 0) return false;
    const mainAction = watchTradeRows[0]?.action;
    const currentAction = watchTradeRows[index]?.action;
    return currentAction !== mainAction;
  };

  // Auto-fill remaining quantity for new exit rows
  React.useEffect(() => {
    watchTradeRows.forEach((row, index) => {
      if (isExitRow(index) && row.quantity === 0) {
        const remaining = calculateRemainingQuantity(index - 1);
        if (remaining > 0) {
          form.setValue(`tradeRows.${index}.quantity`, remaining);
        }
      }
    });
  }, [watchTradeRows, form, calculateRemainingQuantity]);

  // Ensure arrays are valid before rendering
  const validTradeRows = Array.isArray(watchTradeRows) ? watchTradeRows : [];

  return (
    <div className="space-y-6">
      <AccountStrategySelector 
        form={form}
        accounts={accounts}
        strategies={strategies}
      />

      <BasicTradeFields 
        form={form}
        watchMarketType={watchMarketType}
      />

      {/* Trade Entries & Exits */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Trade Entries & Exits</h3>
          <Button type="button" onClick={addTradeRow} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
        </div>

        {/* Desktop Table View */}
        <TradeRowsTable
          form={form}
          watchTradeRows={validTradeRows}
          calculateRemainingQuantity={calculateRemainingQuantity}
          removeTradeRow={removeTradeRow}
          handleQuantityChange={handleQuantityChange}
        />

        {/* Mobile Card View */}
        <TradeRowsCards
          form={form}
          watchTradeRows={validTradeRows}
          calculateRemainingQuantity={calculateRemainingQuantity}
          removeTradeRow={removeTradeRow}
          handleQuantityChange={handleQuantityChange}
        />

        {validTradeRows.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No trade rows available. Click "Add Row" to start.
          </div>
        )}
      </div>
    </div>
  );
}
