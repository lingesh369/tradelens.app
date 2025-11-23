
import React, { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAccounts, Account } from "@/hooks/useAccounts";
import { AccountDialogProps } from "@/types/subscription";

const AccountDialog = ({
  open,
  onOpenChange,
  account
}: AccountDialogProps) => {
  const {
    user
  } = useAuth();
  const {
    profile
  } = useUserProfile();
  const {
    createAccount,
    updateAccount
  } = useAccounts();
  const {
    toast
  } = useToast();
  const [accountName, setAccountName] = useState(account ? account.account_name : "");
  const [broker, setBroker] = useState(account ? account.broker || "" : "");
  const [type, setType] = useState(account ? account.type : "");
  const [startingBalance, setStartingBalance] = useState<number | undefined>(account ? account.starting_balance : undefined);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when dialog opens or account changes
  React.useEffect(() => {
    if (account) {
      setAccountName(account.account_name || "");
      setBroker(account.broker || "");
      setType(account.type || "");
      setStartingBalance(account.starting_balance);
    } else {
      setAccountName("");
      setBroker("");
      setType("");
      setStartingBalance(undefined);
    }
  }, [account, open]);

  // Check account limits for new accounts
  const checkAccountLimits = async () => {
    try {
      // If we're editing an existing account, no need to check limits
      if (account) return true;
      if (!profile?.id) {
        console.log('No profile found, allowing account creation');
        return true;
      }

      // Get current accounts count
      const {
        data: accounts,
        error: accountsError
      } = await supabase.from('accounts').select('account_id').eq('user_id', profile.user_id);
      if (accountsError) {
        console.error('Error fetching accounts for limit check:', accountsError);
        // If we can't check, allow creation
        return true;
      }
      const currentAccountsCount = accounts?.length || 0;
      console.log('Current accounts count:', currentAccountsCount);

      // Get user's subscription limits using the centralized function
      const { data: accessData, error: accessError } = await supabase
        .rpc('get_user_access_matrix', { auth_user_id: profile.auth_id });
      
      if (accessError || !accessData || accessData.length === 0) {
        console.log('No access data found, allowing account creation');
        return true;
      }
      
      const userAccess = accessData[0];
      const accountLimit = userAccess.accountsLimit || 0;
      console.log('Account limit for plan:', accountLimit);
      
      if (currentAccountsCount >= accountLimit) {
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
      // If there's an error checking limits, allow creation
      return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName || !broker || !type || !startingBalance) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return;
    }
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated.",
        variant: "destructive"
      });
      return;
    }
    if (!profile?.id) {
      toast({
        title: "Error",
        description: "User profile not found.",
        variant: "destructive"
      });
      return;
    }
    setIsSaving(true);
    try {
      // Check limits for new accounts
      if (!account) {
        const canAddAccount = await checkAccountLimits();
        if (!canAddAccount) {
          setIsSaving(false);
          return;
        }
      }
      if (account) {
        // Update existing account using the hook
        updateAccount({
          account_id: account.account_id,
          accountData: {
            account_name: accountName,
            broker: broker,
            type: type,
            starting_balance: startingBalance,
            current_balance: account.current_balance || startingBalance,
            status: account.status
          }
        });
      } else {
        // Create new account using the hook
        createAccount({
          account_name: accountName,
          broker: broker,
          type: type,
          starting_balance: startingBalance,
          current_balance: startingBalance,
          status: 'Active'
        });
      }
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save account.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>
        
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {account ? "Edit Trading Account" : "Add New Trading Account"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {account ? "Update your trading account details." : "Enter the details for your new trading account."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Account Name
            </Label>
            <Input type="text" id="name" value={accountName} onChange={e => setAccountName(e.target.value)} className="col-span-3" placeholder="e.g., My Trading Account" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="broker" className="text-right">
              Broker
            </Label>
            <Input type="text" id="broker" value={broker} onChange={e => setBroker(e.target.value)} className="col-span-3" placeholder="e.g., Interactive Brokers" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Account Type
            </Label>
            <Select onValueChange={setType} value={type}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="margin">Margin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startingBalance" className="text-right">
              Starting Balance
            </Label>
            <Input type="number" id="startingBalance" value={startingBalance === undefined ? "" : startingBalance.toString()} onChange={e => setStartingBalance(Number(e.target.value))} className="col-span-3" placeholder="e.g., 10000" />
          </div>
        </form>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isSaving} type="submit" onClick={handleSubmit}>
            {isSaving ? "Saving..." : account ? "Update Account" : "Create Account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AccountDialog;
