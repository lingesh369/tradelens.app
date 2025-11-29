
import React, { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Trade {
  id: string;
  instrument: string;
  action: string;
  entry_price: number;
  exit_price?: number;
  quantity: number;
  trade_date: string;
  trade_metrics?: Array<{
    net_p_and_l: number;
    trade_outcome: string;
  }>;
}

interface MultiSelectTradesProps {
  trades: Trade[];
  selectedTrades: string[];
  onSelectionChange: (selected: string[]) => void;
  className?: string;
}

export function MultiSelectTrades({ trades, selectedTrades, onSelectionChange, className }: MultiSelectTradesProps) {
  const [open, setOpen] = useState(false);

  const handleSelectAll = () => {
    if (selectedTrades.length === trades.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(trades.map(trade => trade.id));
    }
  };

  const handleToggleTrade = (tradeId: string) => {
    if (selectedTrades.includes(tradeId)) {
      onSelectionChange(selectedTrades.filter(id => id !== tradeId));
    } else {
      onSelectionChange([...selectedTrades, tradeId]);
    }
  };

  const formatTradeLabel = (trade: Trade) => {
    const pnl = trade.trade_metrics?.[0]?.net_p_and_l;
    const pnlText = pnl ? `$${pnl.toFixed(2)}` : 'Open';
    return `${trade.instrument} ${trade.action.toUpperCase()} - ${pnlText}`;
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
              {selectedTrades.length === 0
                ? "Select trades..."
                : selectedTrades.length === trades.length
                ? "All trades selected"
                : `${selectedTrades.length} trades selected`}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start" side="bottom">
          <Command>
            <CommandInput placeholder="Search trades..." className="h-9" />
            <CommandList>
              <CommandEmpty>No trades found.</CommandEmpty>
              <CommandGroup>
                <CommandItem onSelect={handleSelectAll} className="cursor-pointer">
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedTrades.length === trades.length ? "opacity-100" : "opacity-0"
                    )}
                  />
                  Select All ({trades.length} trades)
                </CommandItem>
                {trades.map((trade) => (
                  <CommandItem
                    key={trade.id}
                    onSelect={() => handleToggleTrade(trade.id)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedTrades.includes(trade.trade_id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium truncate">{formatTradeLabel(trade)}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(trade.trade_date).toLocaleDateString()}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedTrades.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedTrades.slice(0, 3).map((tradeId) => {
            const trade = trades.find(t => t.trade_id === tradeId);
            return trade ? (
              <Badge key={tradeId} variant="secondary" className="text-xs">
                {trade.instrument}
              </Badge>
            ) : null;
          })}
          {selectedTrades.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{selectedTrades.length - 3} more
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
