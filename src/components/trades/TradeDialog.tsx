
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TradeFormValues } from "./TradeFormSchema";
import { ManualTradeForm } from "./ManualTradeForm";
import { EnhancedManualTradeForm } from "./EnhancedManualTradeForm";
import { ImportTradesForm } from "./ImportTradesForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStrategy?: string;
  initialValues?: Partial<TradeFormValues>;
  useEnhancedForm?: boolean;
}

export function TradeDialog({ 
  open, 
  onOpenChange, 
  defaultStrategy,
  initialValues,
  useEnhancedForm = true
}: TradeDialogProps) {
  const [activeTab, setActiveTab] = useState<string>("manual");

  // Reset tab when dialog closes
  useEffect(() => {
    if (!open) {
      setActiveTab("manual");
    }
  }, [open]);

  // Handle successful form submission
  const handleSuccess = () => {
    // Reset tab to manual
    setActiveTab("manual");
    
    // Close dialog
    onOpenChange(false);
  };

  // Ensure initialValues includes contractMultiplier
  const completeInitialValues = initialValues ? {
    ...initialValues,
    contractMultiplier: initialValues.contractMultiplier || 1
  } : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {initialValues?.trade_id ? 'Edit Trade' : 'Add Trade'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add trades manually or import them from a CSV file
          </DialogDescription>
        </DialogHeader>
        
        <Tabs 
          defaultValue="manual" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="mt-4"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="import">Import Trades</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="space-y-4">
            {useEnhancedForm ? (
              <EnhancedManualTradeForm 
                onClose={() => onOpenChange(false)} 
                onSuccess={handleSuccess}
                defaultStrategy={defaultStrategy}
              />
            ) : (
              <ManualTradeForm 
                onClose={() => onOpenChange(false)} 
                onSuccess={handleSuccess}
                defaultStrategy={defaultStrategy}
                initialValues={completeInitialValues}
              />
            )}
          </TabsContent>
          
          <TabsContent value="import" className="space-y-4">
            <ImportTradesForm onSuccess={handleSuccess} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
