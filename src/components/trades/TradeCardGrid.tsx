
import React from 'react';
import { TradeCard } from './TradeCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';

interface TradeCardGridProps {
  trades: any[];
  isLoading: boolean;
  onViewTrade: (tradeId: string) => void;
  formatCurrency: (value: number) => string;
  formatDateTime: (date: string) => string;
  onAddTradeClick?: () => void;
}

export function TradeCardGrid({ 
  trades, 
  isLoading, 
  onViewTrade, 
  formatCurrency, 
  formatDateTime,
  onAddTradeClick 
}: TradeCardGridProps) {
  const isMobile = useMediaQuery("(max-width: 640px)");

  // Empty state
  if (trades.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center px-4">
        <div className="text-4xl mb-4">📈</div>
        <h3 className="text-lg md:text-xl font-medium text-muted-foreground mb-2">
          No trades found
        </h3>
        <p className="text-sm md:text-base text-muted-foreground max-w-[400px] mb-4">
          Add your first trade to start tracking your performance
        </p>
        {onAddTradeClick && (
          <Button onClick={onAddTradeClick} className="gap-2" size={isMobile ? "sm" : "default"}>
            <Plus className="h-4 w-4" />
            Add Trade
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {isLoading ? (
        // Loading skeleton cards
        Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <div className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))
      ) : (
        // Trade cards
        trades.map((trade) => (
          <TradeCard
            key={trade.id}
            trade={trade}
            onClick={onViewTrade}
            formatCurrency={formatCurrency}
            formatDateTime={formatDateTime}
          />
        ))
      )}
    </div>
  );
}
