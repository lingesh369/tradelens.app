import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { enhancedTradeFormSchema, EnhancedTradeFormValues, TradeRow } from "./EnhancedTradeFormSchema";
import { TradeDetailsTab } from "./enhanced-form/TradeDetailsTab";
import { useAccounts } from "@/hooks/useAccounts";
import { useStrategies } from "@/hooks/useStrategies";
import { useToast } from "@/hooks/use-toast";
import { useTrades } from "@/hooks/useTrades";
import { v4 as uuidv4 } from "uuid";

interface TradeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeData: {
    id: string;
    symbol: string;
    action: string;
    quantity: number;
    entryPrice: number;
    exitPrice?: number | null;
    entryDate: string;
    exitDate?: string;
    marketType?: string;
    accountId?: string | null;
    strategy?: string;
    target?: number | null;
    stopLoss?: number | null;
    contractMultiplier?: number;
    partialExits?: Array<{
      action: string;
      datetime: string;
      quantity: number;
      price: number;
      fee: number;
    }>;
  };
  onSave: (updatedTrade: any) => void;
}

export function TradeEditModal({ isOpen, onClose, tradeData, onSave }: TradeEditModalProps) {
  const { accounts } = useAccounts();
  const { strategies } = useStrategies();
  const { toast } = useToast();
  const { updateTrade } = useTrades();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EnhancedTradeFormValues>({
    resolver: zodResolver(enhancedTradeFormSchema),
    defaultValues: {
      accountId: tradeData.accountId || "",
      strategy: tradeData.strategy || "",
      marketType: tradeData.marketType || "Stock",
      symbol: tradeData.symbol,
      contractMultiplier: tradeData.contractMultiplier || 1,
      target: tradeData.target || undefined,
      stopLoss: tradeData.stopLoss || undefined,
      tradeRows: [],
      notes: "",
      tradeRating: 5,
      tags: [],
      mainImage: "",
      additionalImages: [],
    },
  });

  // Convert trade data to form format
  useEffect(() => {
    if (isOpen && tradeData) {
      console.log('TradeEditModal - Loading trade data:', tradeData);
      
      const entryDateTime = new Date(tradeData.entryDate);
      const entryTime = entryDateTime.toTimeString().slice(0, 5);

      // Normalize action: convert "long"/"short" to "buy"/"sell" for the form
      const normalizeAction = (action: string): "buy" | "sell" => {
        const lowerAction = action.toLowerCase();
        if (lowerAction === "long" || lowerAction === "buy") return "buy";
        if (lowerAction === "short" || lowerAction === "sell") return "sell";
        return "buy"; // default fallback
      };

      const mainAction = normalizeAction(tradeData.action);

      // Create main entry row
      const mainRow: TradeRow = {
        id: uuidv4(),
        action: mainAction,
        date: entryDateTime,
        time: entryTime,
        quantity: tradeData.quantity,
        price: tradeData.entryPrice,
        fee: 0,
      };

      const tradeRows: TradeRow[] = [mainRow];

      // Add partial exits if they exist
      if (tradeData.partialExits && Array.isArray(tradeData.partialExits) && tradeData.partialExits.length > 0) {
        console.log('TradeEditModal - Processing partial exits:', tradeData.partialExits);
        
        tradeData.partialExits.forEach(exit => {
          const exitDateTime = new Date(exit.datetime);
          const exitTime = exitDateTime.toTimeString().slice(0, 5);
          
          tradeRows.push({
            id: uuidv4(),
            action: normalizeAction(exit.action),
            date: exitDateTime,
            time: exitTime,
            quantity: exit.quantity,
            price: exit.price,
            fee: exit.fee || 0,
          });
        });
      } else if (tradeData.exitPrice && tradeData.exitDate) {
        // Add full exit if no partial exits but has exit data
        console.log('TradeEditModal - Adding full exit row');
        
        const exitDateTime = new Date(tradeData.exitDate);
        const exitTime = exitDateTime.toTimeString().slice(0, 5);
        const oppositeAction = mainAction === "buy" ? "sell" : "buy";
        
        tradeRows.push({
          id: uuidv4(),
          action: oppositeAction,
          date: exitDateTime,
          time: exitTime,
          quantity: tradeData.quantity,
          price: tradeData.exitPrice,
          fee: 0,
        });
      }

      console.log('TradeEditModal - Trade rows prepared:', tradeRows);
      console.log('TradeEditModal - Market type:', tradeData.marketType);

      const formData = {
        accountId: tradeData.accountId || "",
        strategy: tradeData.strategy || "",
        marketType: tradeData.marketType || "Stock",
        symbol: tradeData.symbol,
        contractMultiplier: tradeData.contractMultiplier || 1,
        target: tradeData.target || undefined,
        stopLoss: tradeData.stopLoss || undefined,
        tradeRows,
        notes: "",
        tradeRating: 5,
        tags: [],
        mainImage: "",
        additionalImages: [],
      };

      console.log('TradeEditModal - Resetting form with data:', formData);
      form.reset(formData);
    }
  }, [isOpen, tradeData, form]);

  const watchMarketType = form.watch("marketType");
  const watchTradeRows = form.watch("tradeRows");

  const calculateRemainingQuantity = (index: number): number => {
    if (!watchTradeRows || watchTradeRows.length === 0) return 0;
    
    const mainAction = watchTradeRows[0]?.action;
    let totalEntry = 0;
    let totalExit = 0;
    
    // Calculate up to the specified index
    for (let i = 0; i <= index; i++) {
      const row = watchTradeRows[i];
      if (!row) continue;
      
      if (row.action === mainAction) {
        totalEntry += row.quantity;
      } else {
        totalExit += row.quantity;
      }
    }
    
    return Math.max(0, totalEntry - totalExit);
  };

  const addTradeRow = () => {
    const currentRows = form.getValues("tradeRows");
    if (currentRows.length === 0) return;
    
    const mainAction = currentRows[0].action;
    const oppositeAction = mainAction === "buy" ? "sell" : "buy";
    
    // Determine action for new row based on remaining quantity
    let newAction = oppositeAction;
    const remaining = calculateRemainingQuantity(currentRows.length - 1);
    
    if (remaining <= 0) {
      // If fully closed, suggest same action as main for new position
      newAction = mainAction;
    }
    
    const newRow: TradeRow = {
      id: uuidv4(),
      action: newAction,
      date: new Date(),
      time: new Date().toTimeString().slice(0, 5),
      quantity: 0,
      price: 0,
      fee: 0,
    };
    form.setValue("tradeRows", [...currentRows, newRow]);
  };

  const removeTradeRow = (index: number) => {
    const currentRows = form.getValues("tradeRows");
    if (currentRows.length > 1) {
      form.setValue("tradeRows", currentRows.filter((_, i) => i !== index));
    }
  };

  const calculateWeightedExitPrice = (exitRows: TradeRow[]): number => {
    if (exitRows.length === 0) return 0;
    
    const totalValue = exitRows.reduce((sum, row) => sum + (row.quantity * row.price), 0);
    const totalQuantity = exitRows.reduce((sum, row) => sum + row.quantity, 0);
    
    return totalQuantity > 0 ? totalValue / totalQuantity : 0;
  };

  const onSubmit = async (data: EnhancedTradeFormValues) => {
    setIsLoading(true);
    try {
      const rows = data.tradeRows;
      if (rows.length === 0) {
        throw new Error("At least one trade row is required");
      }

      // First row determines the main position
      const mainAction = rows[0].action;
      const oppositeAction = mainAction === "buy" ? "sell" : "buy";
      
      // Convert form action (buy/sell) back to database format (long/short for main position)
      const dbMainAction = mainAction === "buy" ? "long" : "short";
      
      // Separate main position rows from exit rows
      const mainRows = rows.filter(row => row.action === mainAction);
      const exitRows = rows.filter(row => row.action === oppositeAction);

      // Calculate total main position quantity and weighted average entry price
      const totalMainQuantity = mainRows.reduce((sum, row) => sum + Number(row.quantity), 0);
      const weightedEntryPrice = mainRows.reduce((sum, row) => {
        return sum + (Number(row.quantity) * Number(row.price));
      }, 0) / totalMainQuantity;

      // Calculate total exit quantity and weighted average exit price
      const totalExitQuantity = exitRows.reduce((sum, row) => sum + Number(row.quantity), 0);
      const weightedExitPrice = calculateWeightedExitPrice(exitRows);

      // Create the main trade record using the first row for timing
      const firstRow = rows[0];
      const entryDateTime = new Date(firstRow.date);
      const [hours, minutes] = firstRow.time.split(':');
      entryDateTime.setHours(parseInt(hours, 10));
      entryDateTime.setMinutes(parseInt(minutes, 10));

      // Determine exit time if there are exits
      let exitDateTime = null;
      if (exitRows.length > 0) {
        const lastExitRow = exitRows[exitRows.length - 1];
        exitDateTime = new Date(lastExitRow.date);
        const [exitHours, exitMinutes] = lastExitRow.time.split(':');
        exitDateTime.setHours(parseInt(exitHours, 10));
        exitDateTime.setMinutes(parseInt(exitMinutes, 10));
      }

      // Determine status based on exit quantity
      let status: "open" | "partially_closed" | "closed" = "open";
      if (totalExitQuantity > 0) {
        status = totalExitQuantity >= totalMainQuantity ? "closed" : "partially_closed";
      }

      // Calculate total fees
      const totalFees = rows.reduce((sum, row) => sum + (Number(row.fee) || 0), 0);

      // Format partial exits for JSON storage
      const partialExits = exitRows.map(row => {
        const exitDateTime = new Date(row.date);
        const [hours, minutes] = row.time.split(':');
        exitDateTime.setHours(parseInt(hours, 10));
        exitDateTime.setMinutes(parseInt(minutes, 10));
        
        return {
          action: row.action,
          datetime: exitDateTime.toISOString(),
          quantity: Number(row.quantity),
          price: Number(row.price),
          fee: Number(row.fee) || 0
        };
      });

      const updatedTradeData = {
        id: tradeData.id, // Use 'id' not 'trade_id' for updateTrade
        market_type: data.marketType,
        account_id: data.accountId,
        instrument: data.symbol,
        action: dbMainAction, // Use database format (long/short)
        quantity: totalMainQuantity,
        entry_price: weightedEntryPrice,
        exit_price: exitRows.length > 0 ? weightedExitPrice : null,
        entry_time: entryDateTime.toISOString(),
        exit_time: exitDateTime ? exitDateTime.toISOString() : null,
        fees: totalFees,
        commission: 0, // Separate commission if needed
        strategy_id: data.strategy && data.strategy !== "none" ? data.strategy : null,
        sl: data.stopLoss || null,
        target: data.target || null,
        contract_multiplier: data.contractMultiplier,
        remaining_quantity: Math.max(0, totalMainQuantity - totalExitQuantity),
        status: status,
        total_exit_quantity: totalExitQuantity,
        partial_exits: partialExits.length > 0 ? partialExits : null,
        trade_date: entryDateTime.toISOString().split('T')[0], // Add trade_date
      };

      console.log('Updating trade with data:', updatedTradeData);

      // Update the trade
      await updateTrade(updatedTradeData);

      toast({
        title: "Trade Updated Successfully",
        description: "Trade details have been updated",
      });
      
      onSave(updatedTradeData);
      onClose();
    } catch (error: any) {
      console.error("Error updating trade:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update trade",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Trade Details</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <TradeDetailsTab
              form={form}
              accounts={accounts}
              strategies={strategies}
              watchMarketType={watchMarketType}
              watchTradeRows={watchTradeRows}
              calculateRemainingQuantity={calculateRemainingQuantity}
              addTradeRow={addTradeRow}
              removeTradeRow={removeTradeRow}
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
