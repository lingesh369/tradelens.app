
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccounts } from "@/hooks/useAccounts";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountAdded?: () => void;
}

export function AddAccountDialog({ open, onOpenChange, onAccountAdded }: AddAccountDialogProps) {
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState("");
  const [broker, setBroker] = useState("");
  const [startingBalance, setStartingBalance] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { createAccount, accounts } = useAccounts();
  const { user } = useAuth();
  const { toast } = useToast();

  const checkAccountLimits = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated.",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Get current accounts count
      const currentAccountsCount = accounts.length;

      // Get user's subscription limits using the centralized function
      const { data: accessData, error: accessError } = await supabase
        .rpc('get_user_access_matrix', { auth_user_id: user.id });
      
      if (accessError || !accessData || accessData.length === 0) {
        console.log('No access data found, allowing account creation');
        return true;
      }
      
      const userAccess = accessData[0];
      // Use snake_case from database (accountslimit) with fallback to camelCase
      const accountLimit = userAccess.accountslimit ?? userAccess.accountsLimit ?? 0;
      
      // -1 means unlimited
      if (accountLimit !== -1 && currentAccountsCount >= accountLimit) {
        toast({
          title: "Limit Exceeded",
          description: `You have reached the maximum number of trading accounts (${accountLimit}) for your plan.`,
          variant: "destructive"
        });
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error checking account limits:", error);
      return true; // Allow creation if check fails
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check account limits before creating
      const canAddAccount = await checkAccountLimits();
      if (!canAddAccount) {
        setIsLoading(false);
        return;
      }

      await createAccount({
        account_name: accountName,
        type: accountType.toLowerCase(), // Convert to lowercase for new schema (live, demo, paper)
        broker: broker || null,
        starting_balance: parseFloat(startingBalance) || 0,
        current_balance: parseFloat(startingBalance) || 0,
        status: "active" // lowercase to match new schema
      });

      toast({
        title: "Account added successfully",
      });

      // Reset form
      setAccountName("");
      setAccountType("");
      setBroker("");
      setStartingBalance("");
      
      onAccountAdded?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error adding account",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="accountName">Account Name *</Label>
            <Input
              id="accountName"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Enter account name"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="accountType">Account Type *</Label>
            <Select value={accountType} onValueChange={setAccountType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Live">Live</SelectItem>
                <SelectItem value="Demo">Demo</SelectItem>
                <SelectItem value="Paper">Paper</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="broker">Broker</Label>
            <Input
              id="broker"
              value={broker}
              onChange={(e) => setBroker(e.target.value)}
              placeholder="Enter broker name"
            />
          </div>
          
          <div>
            <Label htmlFor="startingBalance">Starting Balance</Label>
            <Input
              id="startingBalance"
              type="number"
              step="0.01"
              value={startingBalance}
              onChange={(e) => setStartingBalance(e.target.value)}
              placeholder="0.00"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
