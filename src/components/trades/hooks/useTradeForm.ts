import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTrades } from "@/hooks/useTrades";
import { useStrategies } from "@/hooks/useStrategies";
import { useAuth } from "@/context/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { tradeFormSchema, TradeFormValues } from "../TradeFormSchema";

interface UseTradeFormProps {
  onSuccess: () => void;
  defaultStrategy?: string;
  initialValues?: Partial<TradeFormValues>;
}

export function useTradeForm({ onSuccess, defaultStrategy, initialValues }: UseTradeFormProps) {
  const [accounts, setAccounts] = useState<{ account_id: string; account_name: string; commission: number | null; fees: number | null }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const { toast } = useToast();
  const { createTrade, updateTrade } = useTrades();
  const { strategies } = useStrategies();
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const defaultValues = {
    marketType: initialValues?.marketType || "",
    accountId: initialValues?.accountId || "",
    instrument: initialValues?.instrument || "",
    contract: initialValues?.contract || "",
    action: initialValues?.action || "buy", 
    quantity: initialValues?.quantity,
    entryPrice: initialValues?.entryPrice,
    entryDate: initialValues?.entryDate || new Date(),
    entryTime: initialValues?.entryTime || format(new Date(), "HH:mm"),
    exitPrice: initialValues?.exitPrice,
    exitDate: initialValues?.exitDate,
    exitTime: initialValues?.exitTime,
    // Ensure commission and fees are always positive
    commission: initialValues?.commission !== undefined ? Math.abs(initialValues.commission) : 0,
    fees: initialValues?.fees !== undefined ? Math.abs(initialValues.fees) : 0,
    notes: initialValues?.notes || "",
    strategyId: initialValues?.strategyId || defaultStrategy || "",
    stopLoss: initialValues?.stopLoss,
    target: initialValues?.target,
    contractMultiplier: initialValues?.contractMultiplier || 1,
  };

  const form = useForm<TradeFormValues>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues,
    mode: "onChange", // This helps validate on change
  });

  const watchMarketType = form.watch("marketType");
  const watchAccountId = form.watch("accountId");

  const fetchAccounts = useCallback(async () => {
    try {
      if (!user || !profile?.id) {
        console.log('No authenticated user or profile found for accounts');
        setAccounts([]);
        return;
      }

      console.log('Fetching accounts for user profile ID:', profile.user_id);

      const { data: accountsData, error } = await supabase
        .from("accounts")
        .select("account_id, account_name, commission, fees")
        .eq("user_id", profile.user_id)
        .order("account_name");

      if (error) {
        throw error;
      }

      if (accountsData) {
        const processedAccounts = accountsData.map(acc => ({
          account_id: acc.account_id,
          account_name: acc.account_name,
          commission: acc.commission !== null ? acc.commission : 0,
          fees: acc.fees !== null ? acc.fees : 0
        }));
        
        console.log('Fetched accounts for user:', processedAccounts);
        setAccounts(processedAccounts);
        
        // Don't auto-select first account - let user choose
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast({
        title: "Error",
        description: "Failed to load your accounts",
        variant: "destructive",
      });
    }
  }, [form, initialValues, toast, user, profile]);

  useEffect(() => {
    if (watchAccountId && watchAccountId !== selectedAccount) {
      const selectedAcc = accounts.find(acc => acc.account_id === watchAccountId);
      if (selectedAcc) {
        // Ensure commission and fees are always positive
        const commission = Math.abs(selectedAcc.commission !== null ? selectedAcc.commission : 0);
        const fees = Math.abs(selectedAcc.fees !== null ? selectedAcc.fees : 0);
        
        form.setValue("commission", commission);
        form.setValue("fees", fees);
        setSelectedAccount(watchAccountId);
        
        console.log(`Updated fees for account ${selectedAcc.account_name}: commission=${commission}, fees=${fees}`);
      }
    }
  }, [watchAccountId, accounts, form, selectedAccount]);

  const onSubmit = async (data: TradeFormValues) => {
    setIsLoading(true);
    try {
      const entryDateTime = data.entryDate;
      if (data.entryTime) {
        const [hours, minutes] = data.entryTime.split(':');
        entryDateTime.setHours(parseInt(hours, 10));
        entryDateTime.setMinutes(parseInt(minutes, 10));
      }
      
      let exitDateTime = undefined;
      if (data.exitDate) {
        exitDateTime = new Date(data.exitDate);
        if (data.exitTime) {
          const [hours, minutes] = data.exitTime.split(':');
          exitDateTime.setHours(parseInt(hours, 10));
          exitDateTime.setMinutes(parseInt(minutes, 10));
        }
      }

      const action = data.action.toLowerCase() as "buy" | "sell";

      // Preserve decimal precision by using parseFloat instead of Number for price fields
      const quantity = parseFloat(data.quantity.toString());
      const entryPrice = parseFloat(data.entryPrice.toString());
      const exitPrice = data.exitPrice !== undefined ? parseFloat(data.exitPrice.toString()) : null;
      const stopLoss = data.stopLoss !== undefined ? parseFloat(data.stopLoss.toString()) : null;
      const target = data.target !== undefined ? parseFloat(data.target.toString()) : null;
      // Ensure commission and fees are always positive
      const commission = Math.abs(data.commission !== undefined ? parseFloat(data.commission.toString()) : 0);
      const fees = Math.abs(data.fees !== undefined ? parseFloat(data.fees.toString()) : 0);
      const contractMultiplier = data.contractMultiplier !== undefined ? parseFloat(data.contractMultiplier.toString()) : 1;

      const tradeData = {
        market_type: data.marketType,
        account_id: data.accountId,
        instrument: data.instrument,
        contract: data.contract || null,
        action: action,
        quantity: quantity,
        entry_price: entryPrice,
        entry_time: entryDateTime.toISOString(),
        exit_price: exitPrice,
        exit_time: exitDateTime ? exitDateTime.toISOString() : null,
        commission: commission,
        fees: fees,
        notes: data.notes || null,
        strategy_id: data.strategyId && data.strategyId !== "none" ? data.strategyId : null,
        sl: stopLoss,
        target: target,
        chart_link: null,
        rating: null,
        contract_multiplier: contractMultiplier,
      };

      console.log("Submitting trade data:", tradeData);
      
      if (initialValues && 'id' in initialValues) {
        await updateTrade({
          id: initialValues.id as string,
          ...tradeData
        });
        toast({
          title: "Trade Updated",
          description: "Your trade has been successfully updated",
        });
      } else {
        await createTrade(tradeData);
        toast({
          title: "Trade Added",
          description: "Your trade has been successfully added",
        });
      }
      
      onSuccess();
    } catch (error: any) {
      console.error("Error with trade:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process trade",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    watchMarketType,
    accounts,
    isLoading,
    fetchAccounts,
    onSubmit,
    strategies
  };
}
