
import React, { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Strategy {
  strategy_id: string;
  strategy_name: string;
  total_trades: number | null;
  win_rate: number | null;
  net_pl: number | null;
}

interface MultiSelectStrategiesProps {
  strategies: Strategy[];
  selectedStrategies: string[];
  onSelectionChange: (selected: string[]) => void;
  className?: string;
}

export function MultiSelectStrategies({ strategies, selectedStrategies, onSelectionChange, className }: MultiSelectStrategiesProps) {
  const [open, setOpen] = useState(false);

  const handleSelectAll = () => {
    if (selectedStrategies.length === strategies.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(strategies.map(strategy => strategy.strategy_id));
    }
  };

  const handleToggleStrategy = (strategyId: string) => {
    if (selectedStrategies.includes(strategyId)) {
      onSelectionChange(selectedStrategies.filter(id => id !== strategyId));
    } else {
      onSelectionChange([...selectedStrategies, strategyId]);
    }
  };

  const formatStrategyLabel = (strategy: Strategy) => {
    const winRate = strategy.win_rate ? `${strategy.win_rate.toFixed(1)}%` : 'N/A';
    const trades = strategy.total_trades || 0;
    return `${strategy.strategy_name} (${trades} trades, ${winRate} WR)`;
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between min-h-[40px]"
          >
            <span className="truncate">
              {selectedStrategies.length === 0
                ? "Select strategies..."
                : selectedStrategies.length === strategies.length
                ? "All strategies selected"
                : `${selectedStrategies.length} strategies selected`}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start" side="bottom">
          <Command>
            <CommandInput placeholder="Search strategies..." className="h-9" />
            <CommandList>
              <CommandEmpty>No strategies found.</CommandEmpty>
              <CommandGroup>
                <CommandItem onSelect={handleSelectAll} className="cursor-pointer">
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedStrategies.length === strategies.length ? "opacity-100" : "opacity-0"
                    )}
                  />
                  Select All ({strategies.length} strategies)
                </CommandItem>
                {strategies.map((strategy) => (
                  <CommandItem
                    key={strategy.strategy_id}
                    onSelect={() => handleToggleStrategy(strategy.strategy_id)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedStrategies.includes(strategy.strategy_id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium truncate">{strategy.strategy_name}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {formatStrategyLabel(strategy)}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedStrategies.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedStrategies.slice(0, 3).map((strategyId) => {
            const strategy = strategies.find(s => s.strategy_id === strategyId);
            return strategy ? (
              <Badge key={strategyId} variant="secondary" className="text-xs">
                {strategy.strategy_name}
              </Badge>
            ) : null;
          })}
          {selectedStrategies.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{selectedStrategies.length - 3} more
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
