import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Dialog, 
  DialogContent,
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCommissions, Commission, CommissionFormValues } from "@/hooks/useCommissions";
import { useAccounts } from "@/hooks/useAccounts";
import { Loader2 } from "lucide-react";

const commissionFormSchema = z.object({
  market_type: z.string().min(1, "Market type is required"),
  commission: z.coerce.number().min(0, "Commission must be a positive number"),
  fees: z.coerce.number().min(0, "Fees must be a positive number"),
  broker: z.string().optional().nullable(),
  account_id: z.string().optional().nullable(),
});

// Updated to use standardized market types
const MARKET_TYPES = ["Stock", "Forex", "Crypto", "Options", "Futures", "Commodities", "Indices"];

interface CommissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commission?: Commission | null;
}

export function CommissionDialog({ open, onOpenChange, commission }: CommissionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { createCommission, updateCommission } = useCommissions();
  const { accounts } = useAccounts();
  
  const defaultValues: Partial<CommissionFormValues> = {
    market_type: "",
    commission: 0,
    fees: 0,
    broker: "",
    account_id: null,
  };
  
  const form = useForm<CommissionFormValues>({
    resolver: zodResolver(commissionFormSchema),
    defaultValues,
  });
  
  // Reset form when dialog opens/closes or commission changes
  useEffect(() => {
    if (open) {
      if (commission) {
        // Pre-fill form with commission data
        form.reset({
          market_type: commission.market_type,
          commission: commission.commission,
          fees: commission.fees,
          broker: commission.broker || "",
          account_id: commission.account_id,
        });
      } else {
        // Reset to defaults for new commission
        form.reset(defaultValues);
      }
    }
  }, [form, commission, open]);
  
  const onSubmit = async (values: CommissionFormValues) => {
    setIsSubmitting(true);
    try {
      if (commission) {
        // Update existing commission
        await updateCommission({ 
          commission_id: commission.commission_id, 
          ...values 
        });
      } else {
        // Add new commission
        await createCommission(values);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting commission:", error);
      toast({
        title: "Error",
        description: "Failed to save commission structure. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {commission ? "Edit Fee Structure" : "Add New Fee Structure"}
          </DialogTitle>
          <DialogDescription>
            {commission 
              ? "Update the commission and fee details for this structure."
              : "Create a new commission and fee structure for your trading."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="market_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Market Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select market type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MARKET_TYPES.map((type) => (
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
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="commission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commission per Trade</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="fees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Fees</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="broker"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Broker (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link to Account (optional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No specific account</SelectItem>
                      {accounts.map((account) => (
                        <SelectItem key={account.account_id} value={account.account_id}>
                          {account.account_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  commission ? "Update" : "Create"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
