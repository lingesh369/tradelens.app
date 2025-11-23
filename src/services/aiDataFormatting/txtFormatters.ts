
import { format } from "date-fns";

export function formatJournalDataForTxt(journalData: any[]): string {
  if (!journalData || journalData.length === 0) {
    return "No journal entries found for the selected date range.";
  }

  let output = "=== JOURNAL ENTRIES ===\n\n";
  
  journalData.forEach(journal => {
    if (!journal.date) return;
    
    const date = format(new Date(journal.date), 'MMMM dd, yyyy (EEEE)');
    output += `📅 ${date}\n`;
    output += "─".repeat(50) + "\n";
    
    // Personal Journal Notes
    if (journal.notes && journal.notes.trim()) {
      output += "📝 PERSONAL JOURNAL NOTES:\n";
      output += journal.notes.trim() + "\n\n";
    }
    
    // Auto-aggregated Trade Notes
    if (journal.all_trades_notes && journal.all_trades_notes.trim()) {
      output += "💼 TRADE NOTES:\n";
      output += journal.all_trades_notes.trim() + "\n\n";
    }
    
    // Auto-aggregated Journal Image Notes
    if (journal.all_journal_images_notes && journal.all_journal_images_notes.trim()) {
      output += "🖼️ CHART & IMAGE NOTES:\n";
      output += journal.all_journal_images_notes.trim() + "\n\n";
    }
    
    output += "\n";
  });

  return output;
}

export function formatTradesDataForTxt(tradeData: any[]): string {
  if (!tradeData || tradeData.length === 0) {
    return "No trade data found for the selected date range.";
  }

  let output = "=== TRADE SUMMARY ===\n\n";
  
  // Group trades by date
  const tradesByDate = tradeData.reduce((acc, trade) => {
    const date = trade.date || 'Unknown Date';
    if (!acc[date]) acc[date] = [];
    acc[date].push(trade);
    return acc;
  }, {});

  Object.keys(tradesByDate).sort().forEach(date => {
    const trades = tradesByDate[date];
    
    try {
      const formattedDate = date !== 'Unknown Date' 
        ? format(new Date(date), 'MMMM dd, yyyy')
        : 'Unknown Date';
      
      output += `📊 ${formattedDate}\n`;
      output += "─".repeat(30) + "\n";
      
      trades.forEach((trade, index) => {
        output += `${index + 1}. ${trade.instrument} (${trade.action})\n`;
        if (trade.net_pl !== undefined) {
          output += `   P&L: ${trade.net_pl > 0 ? '+' : ''}${trade.net_pl}\n`;
        }
        if (trade.notes && trade.notes.trim()) {
          output += `   Notes: ${trade.notes.trim()}\n`;
        }
        output += "\n";
      });
      
      output += "\n";
    } catch (error) {
      console.error(`Error formatting date ${date}:`, error);
      output += `${date}\n`;
      output += "─".repeat(30) + "\n";
      trades.forEach((trade, index) => {
        output += `${index + 1}. ${trade.instrument} (${trade.action})\n`;
        if (trade.notes && trade.notes.trim()) {
          output += `   Notes: ${trade.notes.trim()}\n`;
        }
        output += "\n";
      });
      output += "\n";
    }
  });

  return output;
}
