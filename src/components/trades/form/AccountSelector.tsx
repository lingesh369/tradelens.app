
import { useState } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { TradeFormValues } from "../TradeFormSchema";
import AccountDialog from "@/components/accounts/AccountDialog";

interface AccountSelectorProps {
  form: UseFormReturn<TradeFormValues>;
  accounts: { account_id: string; account_name: string }[];
}

export function AccountSelector({ form, accounts }: AccountSelectorProps) {
  const [showAccountDialog, setShowAccountDialog] = useState(false);

  const handleAddAccount = () => {
    setShowAccountDialog(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setShowAccountDialog(open);
    // The accounts will be refetched automatically due to real-time updates
  };

  return (
    <>
      <FormField
        control={form.control}
        name="accountId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Account</FormLabel>
            <div className="flex gap-2">
              <FormControl className="flex-1">
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem 
                        key={account.account_id} 
                        value={account.account_id}
                      >
                        {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddAccount}
                className="shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <AccountDialog
        open={showAccountDialog}
        onOpenChange={handleDialogOpenChange}
      />
    </>
  );
}
