
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Account } from "@/hooks/useAccounts";
import { Strategy } from "@/hooks/useStrategies";
import { Tag } from "@/hooks/useTags";
import { TradeTagsSection } from "./TradeTagsSection";
import { TradeRatingInput } from "./TradeRatingInput";

interface TradeManagementSectionProps {
  accounts: Account[];
  strategies: Strategy[];
  tags: Tag[];
  selectedAccount: string;
  selectedTimeframe: string;
  selectedStrategy: string;
  selectedTags: string[];
  tradeRating: number;
  isReadOnly?: boolean;
  onAccountChange: (value: string) => void;
  onTimeframeChange: (value: string) => void;
  onStrategyChange: (value: string) => void;
  onTagsChange: (value: string[]) => void;
  onTradeRatingChange: (value: number) => void;
}

export function TradeManagementSection({
  accounts,
  strategies,
  tags,
  selectedAccount,
  selectedTimeframe,
  selectedStrategy,
  selectedTags,
  tradeRating,
  isReadOnly = false,
  onAccountChange,
  onTimeframeChange,
  onStrategyChange,
  onTagsChange,
  onTradeRatingChange
}: TradeManagementSectionProps) {
  const timeframeOptions = [
    { label: "MINUTES", options: [
      { value: "1min", label: "1 minute" },
      { value: "2min", label: "2 minutes" },
      { value: "3min", label: "3 minutes" },
      { value: "5min", label: "5 minutes" },
      { value: "10min", label: "10 minutes" },
      { value: "15min", label: "15 minutes" },
      { value: "30min", label: "30 minutes" },
      { value: "45min", label: "45 minutes" }
    ]},
    { label: "HOURS", options: [
      { value: "1h", label: "1 hour" },
      { value: "2h", label: "2 hours" },
      { value: "3h", label: "3 hours" },
      { value: "4h", label: "4 hours" }
    ]},
    { label: "DAYS", options: [
      { value: "1d", label: "1 day" },
      { value: "1w", label: "1 week" },
      { value: "1M", label: "1 month" }
    ]}
  ];

  const getAccountName = (accountId: string) => {
    if (accountId === "none") return "No Account";
    return accounts.find(account => account.account_id === accountId)?.account_name || "Unknown Account";
  };

  const getStrategyName = (strategyId: string) => {
    if (strategyId === "none") return "No Strategy";
    return strategies.find(strategy => strategy.strategy_id === strategyId)?.strategy_name || "Unknown Strategy";
  };

  const getTimeframeLabel = (value: string) => {
    for (const group of timeframeOptions) {
      const option = group.options.find(opt => opt.value === value);
      if (option) return option.label;
    }
    return value;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Account Selection */}
        <div className="space-y-2">
          <Label>Account</Label>
          {isReadOnly ? (
            <div className="px-3 py-2 bg-muted rounded-md text-sm">
              {getAccountName(selectedAccount)}
            </div>
          ) : (
            <Select value={selectedAccount || "none"} onValueChange={onAccountChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Account</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.account_id} value={account.account_id}>
                    {account.account_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Trade Time Frame */}
        <div className="space-y-2">
          <Label>Trade Time Frame</Label>
          {isReadOnly ? (
            <div className="px-3 py-2 bg-muted rounded-md text-sm">
              {getTimeframeLabel(selectedTimeframe || "15min")}
            </div>
          ) : (
            <Select value={selectedTimeframe || "15min"} onValueChange={onTimeframeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                {timeframeOptions.map((group) => (
                  <div key={group.label}>
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                      {group.label}
                    </div>
                    {group.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Strategy Selection */}
        <div className="space-y-2">
          <Label>Strategy</Label>
          {isReadOnly ? (
            <div className="px-3 py-2 bg-muted rounded-md text-sm">
              {getStrategyName(selectedStrategy)}
            </div>
          ) : (
            <Select value={selectedStrategy || "none"} onValueChange={onStrategyChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Strategy</SelectItem>
                {strategies.map((strategy) => (
                  <SelectItem key={strategy.strategy_id} value={strategy.strategy_id}>
                    {strategy.strategy_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Tags Section */}
        <div className="space-y-2">
          <TradeTagsSection
            selectedTags={selectedTags}
            tags={tags}
            isReadOnly={isReadOnly}
            onTagsChange={onTagsChange}
          />
        </div>
      </div>
      
      {/* Trade Rating Section */}
      <div className="pt-4 border-t">
        <TradeRatingInput
          rating={tradeRating}
          isReadOnly={isReadOnly}
          onRatingChange={onTradeRatingChange}
        />
      </div>
    </div>
  );
}
