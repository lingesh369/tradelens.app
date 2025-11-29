
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { enhancedTradeFormSchema, EnhancedTradeFormValues, TradeRow } from "./EnhancedTradeFormSchema";
import { TradeDetailsTab } from "./enhanced-form/TradeDetailsTab";
import { TradeNotesTab } from "./enhanced-form/TradeNotesTab";
import { useAccounts } from "@/hooks/useAccounts";
import { useStrategies } from "@/hooks/useStrategies";
import { useTags } from "@/hooks/useTags";
import { useToast } from "@/hooks/use-toast";
import { useTrades } from "@/hooks/useTrades";
import { v4 as uuidv4 } from "uuid";

interface EnhancedManualTradeFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
  defaultStrategy?: string;
}

export function EnhancedManualTradeForm({ 
  onSuccess = () => {}, 
  onClose = () => {},
  defaultStrategy
}: EnhancedManualTradeFormProps) {
  const [activeTab, setActiveTab] = useState("details");
  const { accounts } = useAccounts();
  const { strategies, refetch: refetchStrategies } = useStrategies();
  const { tags } = useTags();
  const { toast } = useToast();
  const { createTrade } = useTrades();
  const [isLoading, setIsLoading] = useState(false);

  // Debug: Log strategies when they change
  useEffect(() => {
    console.log('Strategies updated in EnhancedManualTradeForm:', strategies);
  }, [strategies]);

  // Get last used account from localStorage
  const getLastUsedAccount = () => {
    return localStorage.getItem('lastUsedAccount') || "";
  };

  const form = useForm<EnhancedTradeFormValues>({
    resolver: zodResolver(enhancedTradeFormSchema),
    defaultValues: {
      accountId: getLastUsedAccount(),
      strategy: defaultStrategy || "",
      marketType: "Stock",
      symbol: "",
      contractMultiplier: 1,
      isLong: true,
      tradeRows: [{
        id: uuidv4(),
        action: "buy",
        date: new Date(),
        time: new Date().toTimeString().slice(0, 5),
        quantity: 0,
        price: 0,
        fee: 0,
      }],
      notes: "",
      tradeRating: 5,
      uploadedImages: [],
      tags: [],
      mainImage: "",
      additionalImages: [],
    },
  });

  const watchMarketType = form.watch("marketType");
  const watchTradeRows = form.watch("tradeRows");
  const watchAccountId = form.watch("accountId");

  // Save last used account
  useEffect(() => {
    if (watchAccountId) {
      localStorage.setItem('lastUsedAccount', watchAccountId);
    }
  }, [watchAccountId]);

  // Enhanced calculation logic that handles direction-agnostic partial exits
  const calculateRemainingQuantity = (currentRowIndex: number): number => {
    const rows = watchTradeRows.slice(0, currentRowIndex + 1);
    
    if (rows.length === 0) return 0;
    
    // First row determines the main position direction
    const mainAction = rows[0].action;
    const oppositeAction = mainAction === "buy" ? "sell" : "buy";
    
    let totalMainQuantity = 0;
    let totalExitQuantity = 0;

    rows.forEach(row => {
      const quantity = Number(row.quantity) || 0;
      if (row.action === mainAction) {
        totalMainQuantity += quantity;
      } else if (row.action === oppositeAction) {
        totalExitQuantity += quantity;
      }
    });

    return Math.max(0, totalMainQuantity - totalExitQuantity);
  };

  // Calculate weighted average exit price
  const calculateWeightedExitPrice = (exitRows: TradeRow[]): number => {
    if (exitRows.length === 0) return 0;
    
    let totalValue = 0;
    let totalQuantity = 0;
    
    exitRows.forEach(row => {
      const quantity = Number(row.quantity) || 0;
      const price = Number(row.price) || 0;
      totalValue += quantity * price;
      totalQuantity += quantity;
    });
    
    return totalQuantity > 0 ? totalValue / totalQuantity : 0;
  };

  const addTradeRow = () => {
    const currentRows = form.getValues("tradeRows");
    const lastRow = currentRows[currentRows.length - 1];
    
    // Determine the action for the new row based on remaining quantity logic
    let newAction: "buy" | "sell" = "buy";
    if (currentRows.length > 0) {
      const mainAction = currentRows[0].action;
      const remaining = calculateRemainingQuantity(currentRows.length - 1);
      
      // If there's remaining quantity from main position, suggest opposite action for exit
      if (remaining > 0) {
        newAction = mainAction === "buy" ? "sell" : "buy";
      } else {
        // If fully closed, suggest same action as main for new position
        newAction = mainAction;
      }
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

  const onSubmit = async (data: EnhancedTradeFormValues) => {
    setIsLoading(true);
    try {
      // Group rows by action to separate main trades from partial exits
      const rows = data.tradeRows;
      if (rows.length === 0) {
        throw new Error("At least one trade row is required");
      }

      // First row determines the main position
      const mainAction = rows[0].action;
      const oppositeAction = mainAction === "buy" ? "sell" : "buy";
      
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

      // Determine initial status based on exit quantity
      let initialStatus: "open" | "partially_closed" | "closed" = "open";
      if (totalExitQuantity > 0) {
        initialStatus = totalExitQuantity >= totalMainQuantity ? "closed" : "partially_closed";
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

      // Ensure rating is between 1-10
      const safeRating = Math.max(1, Math.min(10, data.tradeRating || 5));

      const mainTradeData = {
        market_type: data.marketType,
        account_id: data.accountId,
        instrument: data.symbol,
        action: mainAction,
        quantity: totalMainQuantity,
        entry_price: weightedEntryPrice,
        exit_price: exitRows.length > 0 ? weightedExitPrice : null,
        entry_time: entryDateTime.toISOString(),
        exit_time: exitDateTime ? exitDateTime.toISOString() : null,
        commission: 0,
        fees: totalFees,
        notes: data.notes || null,
        strategy_id: data.strategy && data.strategy !== "none" ? data.strategy : null,
        sl: data.stopLoss || null,
        target: data.target || null,
        contract_multiplier: data.contractMultiplier,
        tick_size: data.tickSize || null,
        tick_value: data.tickValue || null,
        trade_rating: safeRating,
        chart_link: data.mainImage || null,
        rating: safeRating,
        contract: null,
        trade_time_frame: null,
        remaining_quantity: Math.max(0, totalMainQuantity - totalExitQuantity),
        parent_trade_id: null,
        status: initialStatus,
        total_exit_quantity: totalExitQuantity,
        // Include partial exits data
        partial_exits: partialExits.length > 0 ? partialExits : null,
        // Add new fields for tags and images
        tags: data.tags && data.tags.length > 0 ? data.tags : null,
        main_image: data.mainImage || null,
        additional_images: data.additionalImages && data.additionalImages.length > 0 ? data.additionalImages : null
      };

      console.log("Creating trade with rating:", safeRating, "Original rating:", data.tradeRating);

      // Create the main trade
      await createTrade(mainTradeData);

      toast({
        title: "Trade Added Successfully",
        description: exitRows.length > 0 
          ? `Trade created with ${exitRows.length} partial exit(s). Exit price: ${weightedExitPrice.toFixed(4)}`
          : "Trade has been successfully added",
      });
      
      onSuccess();
    } catch (error: any) {
      console.error("Error creating trade:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create trade",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-6 mt-6">
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
          </TabsContent>
          
          <TabsContent value="notes" className="space-y-6 mt-6">
            <TradeNotesTab
              form={form}
              tags={tags}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Trade"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
