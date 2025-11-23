
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TradePnLBadge } from './components/TradePnLBadge';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/utils/tradeUtils';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';

interface TradeCardProps {
  trade: any;
  onClick: (tradeId: string) => void;
  formatCurrency: (value: number) => string;
  formatDateTime: (date: string) => string;
}

export function TradeCard({ trade, onClick, formatCurrency, formatDateTime }: TradeCardProps) {
  const { settings } = useGlobalSettings();
  
  const handleClick = () => {
    onClick(trade.id);
  };

  // Get the main trade image or use placeholder
  const getImageUrl = () => {
    // First check for main trade image
    if (trade.main_image_url) {
      return trade.main_image_url;
    }
    
    // Use placeholder image
    return '/placeholder.svg';
  };

  const imageUrl = getImageUrl();

  // Format the action badge
  const actionBadgeVariant = trade.action === 'BUY' ? 'default' : 'secondary';
  
  // Format date
  const tradeDate = trade.entryDate ? new Date(trade.entryDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  // Format time
  const entryTime = trade.entryDate ? new Date(trade.entryDate).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }) : '';

  const exitTime = trade.exitDate ? new Date(trade.exitDate).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }) : '';

  // Format time range
  const timeRange = exitTime ? `${entryTime} - ${exitTime}` : entryTime;

  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] group h-full flex flex-col"
      onClick={handleClick}
    >
      <CardContent className="p-0 flex flex-col h-full">
        {/* Trade Image */}
        <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden flex-shrink-0">
          <img 
            src={imageUrl} 
            alt={`${trade.instrument} trade`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
          {/* Status badge overlay */}
          <div className="absolute top-2 right-2">
            <Badge 
              variant={trade.status === 'WIN' ? 'default' : trade.status === 'LOSS' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {trade.status}
            </Badge>
          </div>
        </div>

        {/* Trade Details */}
        <div className="p-4 space-y-3 flex-1 flex flex-col min-h-0">
          {/* Instrument & Action */}
          <div className="flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-lg truncate">{trade.instrument}</span>
              <Badge variant={actionBadgeVariant} className="text-xs flex-shrink-0">
                {trade.action}
              </Badge>
            </div>
            <div className="flex-shrink-0">
              <TradePnLBadge pnl={trade.netPnl} pnlPercent={trade.percentGain} />
            </div>
          </div>

          {/* Price Range */}
          <div className="flex items-center justify-between text-sm text-muted-foreground flex-shrink-0">
            <span className="truncate">Entry: {formatCurrency(trade.entryPrice)}</span>
            {trade.exitPrice && (
              <span className="truncate">Exit: {formatCurrency(trade.exitPrice)}</span>
            )}
          </div>

          {/* Time Range and Date - Single Row */}
          <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-2 flex-shrink-0">
            <span className="truncate">{timeRange}</span>
            <span className="truncate text-right">{tradeDate}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
