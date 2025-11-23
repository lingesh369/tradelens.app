
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TradeBasicInfoFields } from "./form/TradeBasicInfoFields";
import { TradePriceFields } from "./form/TradePriceFields";
import { TradeDateFields } from "./form/TradeDateFields";
import { TradeFeeFields } from "./form/TradeFeeFields";
import { TradeNotesField } from "./form/TradeNotesField";
import { useTradeForm } from "./hooks/useTradeForm";
import { TradeFormValues } from "./TradeFormSchema";

interface ManualTradeFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
  defaultStrategy?: string;
  initialValues?: Partial<TradeFormValues>;
}

export function ManualTradeForm({ 
  onSuccess = () => {}, 
  onClose = () => {},
  defaultStrategy,
  initialValues
}: ManualTradeFormProps) {
  const {
    form,
    watchMarketType,
    accounts,
    isLoading,
    fetchAccounts,
    onSubmit,
    strategies
  } = useTradeForm({ 
    onSuccess: () => {
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    },
    defaultStrategy,
    initialValues: {
      ...initialValues,
      contractMultiplier: initialValues?.contractMultiplier || 1
    }
  });

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TradeBasicInfoFields 
            form={form} 
            accounts={accounts} 
            strategies={strategies} 
            watchMarketType={watchMarketType} 
          />
          <TradePriceFields form={form} />
          <TradeDateFields form={form} />
          <TradeFeeFields form={form} />
        </div>

        <TradeNotesField form={form} />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Submitting..." : initialValues?.trade_id ? "Update Trade" : "Add Trade"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
