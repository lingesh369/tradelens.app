
import { useState, useEffect } from "react";
import { CheckIcon, ChevronsUpDown, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useAccounts, Account } from "@/hooks/useAccounts";
import { useNavigate } from "react-router-dom";

export interface SelectedAccounts {
  allAccounts: boolean;
  accountIds: string[];
}

interface MultiSelectAccountSelectorProps {
  onChange: (selectedAccounts: SelectedAccounts) => void;
  selectedAccounts?: SelectedAccounts;
  className?: string;
}

export function MultiSelectAccountSelector({ onChange, selectedAccounts: initialSelectedAccounts, className }: MultiSelectAccountSelectorProps) {
  const { accounts } = useAccounts();
  const navigate = useNavigate();
  
  const [open, setOpen] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<SelectedAccounts>(
    initialSelectedAccounts || { allAccounts: true, accountIds: [] }
  );

  console.log("MultiSelectAccountSelector - Initial selectedAccounts:", selectedAccounts);
  console.log("MultiSelectAccountSelector - Available accounts:", accounts);

  // Initialize with provided selectedAccounts if available
  useEffect(() => {
    if (initialSelectedAccounts) {
      console.log("MultiSelectAccountSelector - Updating from prop:", initialSelectedAccounts);
      setSelectedAccounts(initialSelectedAccounts);
    }
  }, [initialSelectedAccounts]);

  const handleSelectAllAccounts = () => {
    const newSelection = {
      allAccounts: true,
      accountIds: []
    };
    console.log("MultiSelectAccountSelector - Select all accounts:", newSelection);
    setSelectedAccounts(newSelection);
    onChange(newSelection);
  };

  const handleToggleAccount = (accountId: string) => {
    const isSelected = selectedAccounts.accountIds.includes(accountId);
    
    let newAccountIds: string[];
    if (isSelected) {
      newAccountIds = selectedAccounts.accountIds.filter(id => id !== accountId);
    } else {
      newAccountIds = [...selectedAccounts.accountIds, accountId];
    }
    
    const newSelection = {
      allAccounts: false,
      accountIds: newAccountIds
    };
    
    // If no accounts are selected, default to "All Accounts"
    if (newAccountIds.length === 0) {
      newSelection.allAccounts = true;
    }
    
    console.log("MultiSelectAccountSelector - Toggle account:", accountId, "New selection:", newSelection);
    setSelectedAccounts(newSelection);
    onChange(newSelection);
  };

  const handleManageAccounts = () => {
    setOpen(false);
    navigate("/settings");
  };

  // Get display text for the button
  const getDisplayText = () => {
    if (selectedAccounts.allAccounts) {
      return "All Accounts";
    }
    
    if (selectedAccounts.accountIds.length === 0) {
      return "All Accounts";
    }
    
    if (selectedAccounts.accountIds.length === 1) {
      const account = accounts.find(a => a.account_id === selectedAccounts.accountIds[0]);
      return account?.account_name || "1 Account";
    }
    
    return `${selectedAccounts.accountIds.length} Accounts`;
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex items-center justify-between w-full h-9"
          >
            <span className="truncate">{getDisplayText()}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search accounts..." />
            <CommandList>
              <CommandEmpty>No accounts found.</CommandEmpty>
              
              <CommandGroup>
                <CommandItem 
                  onSelect={handleSelectAllAccounts}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox 
                    checked={selectedAccounts.allAccounts}
                    onCheckedChange={handleSelectAllAccounts}
                    id="all-accounts"
                    className="data-[state=checked]:bg-primary"
                  />
                  <span className="ml-2">All Accounts</span>
                  {selectedAccounts.allAccounts && (
                    <CheckIcon className="ml-auto h-4 w-4" />
                  )}
                </CommandItem>
              </CommandGroup>
              
              <CommandSeparator />
              
              <CommandGroup heading="Select Accounts">
                {accounts.map((account) => (
                  <CommandItem
                    key={account.account_id}
                    onSelect={() => handleToggleAccount(account.account_id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox 
                      checked={!selectedAccounts.allAccounts && selectedAccounts.accountIds.includes(account.account_id)}
                      onCheckedChange={() => handleToggleAccount(account.account_id)}
                      id={account.account_id}
                      className="data-[state=checked]:bg-primary"
                    />
                    <span className="ml-2">{account.account_name}</span>
                    {!selectedAccounts.allAccounts && selectedAccounts.accountIds.includes(account.account_id) && (
                      <CheckIcon className="ml-auto h-4 w-4" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              
              <CommandSeparator />
              
              <CommandGroup>
                <CommandItem 
                  onSelect={handleManageAccounts}
                  className="flex items-center text-muted-foreground cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Manage Accounts</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
