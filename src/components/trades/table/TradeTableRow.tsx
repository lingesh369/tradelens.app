import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface TradeTableRowProps {
  trade: any;
  availableColumns: Array<{
    id: string;
    label: string;
    default?: boolean;
    priority?: number;
    render?: (trade: any) => React.ReactNode;
  }>;
  activeColumns: string[];
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onClick: (event: React.MouseEvent) => void;
  formatDateTime: (date: string) => string;
  formatCurrency: (value: number) => string;
  strategies?: any[];
}

export function TradeTableRow({
  trade,
  availableColumns,
  activeColumns,
  isSelected,
  onSelect,
  onClick,
  formatDateTime,
  formatCurrency,
  strategies
}: TradeTableRowProps) {
  
  const renderCellContent = (columnId: string, trade: any) => {
    switch (columnId) {
      case 'entry_time':
      case 'exit_time':
      case 'entryDate':
      case 'exitDate':
        const dateValue = trade[columnId] || 
                          (columnId === 'entryDate' ? trade.entry_time : null) || 
                          (columnId === 'exitDate' ? trade.exit_time : null);
        return dateValue ? (
          <span className="whitespace-nowrap text-xs sm:text-sm">
            {formatDateTime(dateValue)}
          </span>
        ) : '-';
      
      case 'net_pl':
      case 'gross_pl':
      case 'netPnl':
      case 'grossPnl':
        const plValue = trade[columnId] || 
                        (columnId === 'netPnl' ? trade.net_pl : null) || 
                        (columnId === 'grossPnl' ? trade.gross_pl : null) || 0;
        return (
          <span className={cn(
            "font-medium whitespace-nowrap text-xs sm:text-sm",
            plValue > 0 ? "text-green-500" : plValue < 0 ? "text-red-500" : ""
          )}>
            {formatCurrency(plValue)}
          </span>
        );
      
      case 'percent_gain':
      case 'percentGain':
        const percentValue = trade[columnId] || 
                             (columnId === 'percentGain' ? trade.percent_gain : null) || 0;
        return (
          <span className={cn(
            "font-medium whitespace-nowrap text-xs sm:text-sm",
            percentValue > 0 ? "text-green-500" : percentValue < 0 ? "text-red-500" : ""
          )}>
            {percentValue > 0 ? '+' : ''}{percentValue.toFixed(2)}%
          </span>
        );
      
      case 'trade_result':
      case 'status':
        const result = trade[columnId] || 
                       (columnId === 'status' ? trade.trade_result : null);
        return result ? (
          <Badge 
            variant={result.toLowerCase() === 'win' || result.toLowerCase() === 'open' ? 'default' : 'destructive'}
            className="text-xs whitespace-nowrap"
          >
            {result.toUpperCase()}
          </Badge>
        ) : '-';
      
      case 'action':
        return (
          <Badge 
            variant={trade[columnId]?.toLowerCase() === 'buy' ? 'default' : 'outline'}
            className="text-xs whitespace-nowrap"
          >
            {trade[columnId]?.toUpperCase() || 'BUY'}
          </Badge>
        );
      
      case 'r2r':
        return trade[columnId] ? (
          <span className="text-xs sm:text-sm">{trade[columnId].toFixed(2)}</span>
        ) : '-';
      
      case 'entry_price':
      case 'exit_price':
      case 'stop_loss':
      case 'target_price':
      case 'entryPrice':
      case 'exitPrice':
      case 'stopLoss':
      case 'target':
        const priceValue = trade[columnId] || 
                          (columnId === 'entryPrice' ? trade.entry_price : null) || 
                          (columnId === 'exitPrice' ? trade.exit_price : null) || 
                          (columnId === 'stopLoss' ? trade.stop_loss || trade.sl : null) || 
                          (columnId === 'target' ? trade.target_price || trade.target : null);
        return priceValue ? (
          <span className="whitespace-nowrap text-xs sm:text-sm">
            {priceValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </span>
        ) : '-';
      
      case 'quantity':
        return trade[columnId] ? (
          <span className="text-xs sm:text-sm">{trade[columnId].toLocaleString()}</span>
        ) : '-';
      
      case 'fees':
      case 'commission':
      case 'totalFees':
        const feesValue = trade[columnId] || 
                          (columnId === 'totalFees' ? (trade.commission || 0) + (trade.fees || 0) : null) || 0;
        return <span className="whitespace-nowrap text-xs sm:text-sm">{formatCurrency(feesValue)}</span>;
      
      case 'trade_duration':
        return <span className="text-xs sm:text-sm">{trade[columnId] || '-'}</span>;
        
      case 'instrument':
      case 'symbol':
        return (
          <span className="font-medium truncate max-w-[100px] sm:max-w-none text-xs sm:text-sm" title={trade.instrument || trade.symbol}>
            {trade.instrument || trade.symbol || '-'}
          </span>
        );
        
      case 'strategy':
        const strategyName = trade.strategy || 
               (trade.strategy_id && strategies ? 
                strategies.find(s => s.strategy_id === trade.strategy_id)?.strategy_name : '-');
        return (
          <span className="truncate max-w-[80px] sm:max-w-none text-xs sm:text-sm" title={strategyName}>
            {strategyName}
          </span>
        );
              
      case 'marketType':
      case 'market_type':
      case 'timeframe':
        return (
          <span className="text-xs sm:text-sm">
            {trade.marketType || trade.market_type || trade.timeframe || '-'}
          </span>
        );
      
      case 'notes':
        const notesValue = trade.notes || '';
        const cleanNotes = notesValue.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        return cleanNotes ? (
          <div className="max-w-[200px]">
            <span className="text-xs sm:text-sm line-clamp-2 leading-relaxed" title={cleanNotes}>
              {cleanNotes}
            </span>
          </div>
        ) : '-';
      
      case 'tags':
        const tagsValue = trade.tags;
        if (!tagsValue) return '-';
        
        // Handle both array format and JSON string format
        let parsedTags = [];
        try {
          if (typeof tagsValue === 'string') {
            parsedTags = JSON.parse(tagsValue);
          } else if (Array.isArray(tagsValue)) {
            parsedTags = tagsValue;
          }
        } catch (e) {
          return '-';
        }
        
        return parsedTags.length > 0 ? (
          <div className="flex flex-wrap gap-1 max-w-[150px]">
            {parsedTags.slice(0, 2).map((tag: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                {tag}
              </Badge>
            ))}
            {parsedTags.length > 2 && (
              <span className="text-xs text-muted-foreground">+{parsedTags.length - 2}</span>
            )}
          </div>
        ) : '-';
      
      case 'tradeRating':
      case 'trade_rating':
      case 'rating':
        const ratingValue = trade.trade_rating || trade.rating || 0;
        return ratingValue > 0 ? (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs sm:text-sm">{ratingValue}/10</span>
          </div>
        ) : '-';
      
      default:
        return <span className="text-xs sm:text-sm">{trade[columnId] || '-'}</span>;
    }
  };

  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/50"
      onClick={onClick}
    >
      <TableCell data-checkbox="true" className="px-2 sm:px-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
          className="h-3 w-3 sm:h-4 sm:w-4"
        />
      </TableCell>
      {availableColumns
        .filter(column => activeColumns.includes(column.id))
        .map(column => (
          <TableCell key={column.id} className="px-2 sm:px-4 py-2 sm:py-4">
            <div className="min-w-0 text-xs sm:text-sm">
              {column.render ? (
                column.render(trade)
              ) : (
                renderCellContent(column.id, trade)
              )}
            </div>
          </TableCell>
        ))}
    </TableRow>
  );
}
