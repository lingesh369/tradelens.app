
import { format } from "date-fns";

interface ColumnOption {
  id: string;
  label: string;
  default?: boolean;
  priority?: number;
}

export const exportToCSV = (
  data: any[],
  filename: string,
  selectedColumns: string[],
  availableColumns: ColumnOption[]
) => {
  if (!data || data.length === 0) return;

  // Get column headers based on selected columns
  const headers = availableColumns
    .filter(col => selectedColumns.includes(col.id))
    .map(col => col.label);

  // Format data rows
  const rows = data.map(trade => {
    return availableColumns
      .filter(col => selectedColumns.includes(col.id))
      .map(col => {
        const value = getFormattedValue(trade, col.id);
        // Escape quotes and wrap in quotes if contains comma or quote
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
  });

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const getFormattedValue = (trade: any, columnId: string): string => {
  switch (columnId) {
    case 'entryDate':
    case 'entry_time':
      const entryDate = trade.entry_time || trade.entryDate;
      return entryDate ? format(new Date(entryDate), 'yyyy-MM-dd HH:mm:ss') : '';
    
    case 'exitDate':
    case 'exit_time':
      const exitDate = trade.exit_time || trade.exitDate;
      return exitDate ? format(new Date(exitDate), 'yyyy-MM-dd HH:mm:ss') : '';
    
    case 'netPnl':
    case 'net_pl':
      return (trade.net_pl || trade.netPnl || 0).toString();
    
    case 'grossPnl':
    case 'gross_pl':
      return (trade.gross_pl || trade.grossPnl || 0).toString();
    
    case 'percentGain':
    case 'percent_gain':
      const percentValue = trade.percent_gain || trade.percentGain || 0;
      return `${percentValue.toFixed(2)}%`;
    
    case 'status':
    case 'trade_result':
      return trade.trade_result || trade.status || '';
    
    case 'action':
      return trade.action || 'BUY';
    
    case 'entryPrice':
    case 'entry_price':
      return (trade.entry_price || trade.entryPrice || 0).toString();
    
    case 'exitPrice':
    case 'exit_price':
      return (trade.exit_price || trade.exitPrice || 0).toString();
    
    case 'stopLoss':
    case 'stop_loss':
    case 'sl':
      return (trade.stop_loss || trade.sl || trade.stopLoss || 0).toString();
    
    case 'target':
    case 'target_price':
      return (trade.target_price || trade.target || 0).toString();
    
    case 'quantity':
      return (trade.quantity || 0).toString();
    
    case 'totalFees':
      const totalFees = (trade.commission || 0) + (trade.fees || 0);
      return totalFees.toString();
    
    case 'fees':
    case 'commission':
      return (trade[columnId] || 0).toString();
    
    case 'r2r':
      return trade.r2r ? trade.r2r.toFixed(2) : '';
    
    case 'instrument':
    case 'symbol':
      return trade.instrument || trade.symbol || '';
    
    case 'strategy':
      return trade.strategy || '';
    
    case 'marketType':
    case 'market_type':
      return trade.marketType || trade.market_type || '';
    
    case 'timeframe':
    case 'trade_time_frame':
      return trade.timeframe || trade.trade_time_frame || '';
    
    case 'account':
      return trade.account || '';
    
    case 'notes':
      // Clean up notes for CSV - remove HTML tags and extra whitespace
      const notes = trade.notes || '';
      return notes.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    
    case 'tags':
      const tagsValue = trade.tags;
      if (!tagsValue) return '';
      
      let parsedTags = [];
      try {
        if (typeof tagsValue === 'string') {
          parsedTags = JSON.parse(tagsValue);
        } else if (Array.isArray(tagsValue)) {
          parsedTags = tagsValue;
        }
        return parsedTags.join('; ');
      } catch (e) {
        return '';
      }
    
    case 'tradeRating':
    case 'trade_rating':
    case 'rating':
      const rating = trade.trade_rating || trade.rating || 0;
      return rating > 0 ? `${rating}/10` : '';
    
    default:
      return trade[columnId]?.toString() || '';
  }
};
