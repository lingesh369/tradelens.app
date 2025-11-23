
import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Plus } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnhancedTradeFormValues } from "../EnhancedTradeFormSchema";
import { AddAccountDialog } from "./AddAccountDialog";
import { AddStrategyDialog } from "./AddStrategyDialog";

interface AccountStrategySelectorProps {
  form: UseFormReturn<EnhancedTradeFormValues>;
  accounts: any[];
  strategies: any[];
}

export function AccountStrategySelector({
  form,
  accounts = [],
  strategies = [],
}: AccountStrategySelectorProps) {
  const [showAddAccountDialog, setShowAddAccountDialog] = useState(false);
  const [showAddStrategyDialog, setShowAddStrategyDialog] = useState(false);

  // Ensure arrays are valid before rendering
  const validAccounts = Array.isArray(accounts) ? accounts : [];
  const validStrategies = Array.isArray(strategies) ? strategies : [];

  // Sort accounts by creation date (latest first)
  const sortedAccounts = [...validAccounts].sort((a, b) => {
    const dateA = new Date(a.created_at || 0);
    const dateB = new Date(b.created_at || 0);
    return dateB.getTime() - dateA.getTime();
  });

  // Set default account to latest created if not already set
  React.useEffect(() => {
    if (sortedAccounts.length > 0 && !form.getValues("accountId")) {
      form.setValue("accountId", sortedAccounts[0].account_id);
    }
  }, [sortedAccounts, form]);

  return (
    <>
      {/* Account & Strategy - Side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account</FormLabel>
              <div className="flex gap-2">
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sortedAccounts.length > 0 ? (
                      sortedAccounts.map((account) => (
                        <SelectItem key={account.account_id} value={account.account_id}>
                          {account.account_name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-accounts" disabled>
                        No accounts available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddAccountDialog(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="strategy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Strategy</FormLabel>
              <div className="flex gap-2">
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No Strategy</SelectItem>
                    {validStrategies.length > 0 && (
                      validStrategies.map((strategy) => (
                        <SelectItem key={strategy.strategy_id} value={strategy.strategy_id}>
                          {strategy.strategy_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddStrategyDialog(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Add Account Dialog */}
      <AddAccountDialog
        open={showAddAccountDialog}
        onOpenChange={setShowAddAccountDialog}
        onAccountAdded={() => {
          // Refresh accounts if needed
        }}
      />

      {/* Add Strategy Dialog */}
      <AddStrategyDialog
        open={showAddStrategyDialog}
        onOpenChange={setShowAddStrategyDialog}
        onStrategyAdded={() => {
          // Refresh strategies if needed
        }}
      />
    </>
  );
}
